from unittest.mock import patch

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import Organization
from assets.models import Asset
from dns_tools.models import DNSHealthScan


class DNSHealthApiTests(APITestCase):
    def setUp(self):
        self.organization = Organization.objects.create(
            name='DNS Org',
            contact_email='ops@dns.test',
            allowed_domains='dns.test',
        )
        self.user = get_user_model().objects.create_user(
            username='dns-user',
            email='analyst@dns.test',
            password='SecurePass123!',
            organization=self.organization,
        )

    @patch('dns_tools.views.dns_health_check')
    def test_dns_health_check_syncs_linked_domain_asset_score_for_authenticated_user(self, dns_health_mock):
        Asset.objects.create(
            organization=self.organization,
            created_by=self.user,
            name='Main Domain',
            asset_type='domain',
            value='example.com',
            category='production',
            risk_score=10,
        )
        dns_health_mock.return_value = {
            'domain': 'example.com',
            'score': 84,
            'grade': 'B',
            'checks': {},
            'recommendations': [],
        }
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            '/dns-tools/health/',
            {'domain_name': 'example.com'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        asset = Asset.objects.get(value='example.com')
        self.assertEqual(asset.risk_score, 84)
        self.assertEqual(DNSHealthScan.objects.filter(user=self.user, domain_name='example.com').count(), 1)

    @patch('dns_tools.views.dns_health_check')
    def test_dns_health_check_remains_public_for_anonymous_requests(self, dns_health_mock):
        dns_health_mock.return_value = {
            'domain': 'example.com',
            'score': 72,
            'grade': 'C',
            'checks': {},
            'recommendations': [],
        }

        response = self.client.post(
            '/dns-tools/health/',
            {'domain_name': 'example.com'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['score'], 72)
        self.assertEqual(DNSHealthScan.objects.count(), 0)

    def test_dns_health_history_returns_authenticated_user_scans(self):
        DNSHealthScan.objects.create(
            organization=self.organization,
            user=self.user,
            domain_name='example.com',
            score=81,
            grade='B',
            checks={'a_record': {'status': 'OK'}},
            recommendations=[],
        )
        self.client.force_authenticate(user=self.user)

        response = self.client.get('/dns-tools/history/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['dns_health_scans']), 1)
        self.assertEqual(response.data['dns_health_scans'][0]['domain_name'], 'example.com')

    def test_delete_dns_health_history_entry_is_scoped_to_authenticated_user(self):
        other_user = get_user_model().objects.create_user(
            username='other-dns-user',
            email='other@dns.test',
            password='SecurePass123!',
            organization=self.organization,
        )
        scan = DNSHealthScan.objects.create(
            organization=self.organization,
            user=other_user,
            domain_name='example.org',
            score=55,
            grade='D',
            checks={},
            recommendations=[],
        )
        self.client.force_authenticate(user=self.user)

        response = self.client.delete(f'/dns-tools/history/{scan.id}/')

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(DNSHealthScan.objects.filter(id=scan.id).exists())
