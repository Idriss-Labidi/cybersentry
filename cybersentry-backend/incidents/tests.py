from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from oauth2_provider.models import AccessToken, Application
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import Organization
from .models import IncidentTicket


class IncidentTicketApiTests(APITestCase):
    def setUp(self):
        self.organization = Organization.objects.create(
            name='Incident Org',
            contact_email='ops@incident.test',
            allowed_domains='incident.test',
        )
        self.user = get_user_model().objects.create_user(
            username='incident-user',
            email='analyst@incident.test',
            password='StrongPassword123!',
            organization=self.organization,
        )
        self.application = Application.objects.create(
            name='Incident Test App',
            client_type=Application.CLIENT_PUBLIC,
            authorization_grant_type=Application.GRANT_PASSWORD,
            user=self.user,
        )
        self.token = AccessToken.objects.create(
            user=self.user,
            scope='read write',
            expires=timezone.now() + timedelta(hours=1),
            token='incident-access-token',
            application=self.application,
        )
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token.token}')

    def test_create_incident_ticket(self):
        response = self.client.post(
            '/api/incidents/',
            {
                'title': 'Suspicious login burst',
                'description': 'Multiple failed logins from unusual regions.',
                'priority': 'high',
                'severity': 'high',
                'status': 'new',
                'sla_policy': 'gold',
                'due_at': (timezone.now() + timedelta(hours=6)).isoformat(),
                'tags': ['auth', 'soc'],
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(IncidentTicket.objects.count(), 1)
        ticket = IncidentTicket.objects.first()
        self.assertEqual(ticket.organization_id, self.organization.id)
        self.assertEqual(ticket.source, IncidentTicket.Sources.MANUAL)

    def test_list_filters_by_status_priority_and_search(self):
        IncidentTicket.objects.create(
            organization=self.organization,
            created_by=self.user,
            updated_by=self.user,
            title='DNS tampering alert',
            description='Unexpected TXT changes',
            status=IncidentTicket.Statuses.IN_PROGRESS,
            priority=IncidentTicket.Priorities.CRITICAL,
            due_at=timezone.now() + timedelta(hours=12),
        )
        IncidentTicket.objects.create(
            organization=self.organization,
            created_by=self.user,
            updated_by=self.user,
            title='Routine policy review',
            description='Quarterly review',
            status=IncidentTicket.Statuses.NEW,
            priority=IncidentTicket.Priorities.LOW,
        )

        response = self.client.get(
            '/api/incidents/',
            {
                'status': IncidentTicket.Statuses.IN_PROGRESS,
                'priority': IncidentTicket.Priorities.CRITICAL,
                'search': 'tampering',
            },
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'DNS tampering alert')

    def test_sla_state_filter_breached(self):
        breached = IncidentTicket.objects.create(
            organization=self.organization,
            created_by=self.user,
            updated_by=self.user,
            title='Old unresolved incident',
            status=IncidentTicket.Statuses.IN_PROGRESS,
            due_at=timezone.now() - timedelta(hours=1),
        )
        IncidentTicket.objects.create(
            organization=self.organization,
            created_by=self.user,
            updated_by=self.user,
            title='Future incident',
            status=IncidentTicket.Statuses.NEW,
            due_at=timezone.now() + timedelta(hours=24),
        )

        response = self.client.get('/api/incidents/', {'sla_state': 'breached'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], breached.id)

    def test_close_and_reopen_actions(self):
        ticket = IncidentTicket.objects.create(
            organization=self.organization,
            created_by=self.user,
            updated_by=self.user,
            title='Service instability',
            status=IncidentTicket.Statuses.IN_PROGRESS,
        )

        close_response = self.client.post(f'/api/incidents/{ticket.id}/close/', {}, format='json')
        self.assertEqual(close_response.status_code, status.HTTP_200_OK)
        self.assertEqual(close_response.data['status'], IncidentTicket.Statuses.CLOSED)

        reopen_response = self.client.post(f'/api/incidents/{ticket.id}/reopen/', {}, format='json')
        self.assertEqual(reopen_response.status_code, status.HTTP_200_OK)
        self.assertEqual(reopen_response.data['status'], IncidentTicket.Statuses.IN_PROGRESS)

    def test_isolation_between_organizations(self):
        other_org = Organization.objects.create(
            name='Other Incident Org',
            contact_email='other@incident.test',
            allowed_domains='incident.test',
        )
        foreign_ticket = IncidentTicket.objects.create(
            organization=other_org,
            title='Foreign ticket',
            status=IncidentTicket.Statuses.NEW,
        )

        list_response = self.client.get('/api/incidents/')
        detail_response = self.client.get(f'/api/incidents/{foreign_ticket.id}/')

        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_response.data), 0)
        self.assertEqual(detail_response.status_code, status.HTTP_404_NOT_FOUND)

