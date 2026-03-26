from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import Organization

from .models import IPReputationScan


class IPHistoryApiTests(APITestCase):
    def setUp(self):
        self.organization = Organization.objects.create(
            name='IP Org',
            contact_email='ops@ip.test',
            allowed_domains='ip.test',
        )
        self.user = get_user_model().objects.create_user(
            username='ip-user',
            email='analyst@ip.test',
            password='SecurePass123!',
            organization=self.organization,
        )
        self.other_user = get_user_model().objects.create_user(
            username='other-ip-user',
            email='other@ip.test',
            password='SecurePass123!',
            organization=self.organization,
        )
        self.client.force_authenticate(user=self.user)

    def test_delete_scan_history_entry_removes_user_scan(self):
        scan = IPReputationScan.objects.create(
            user=self.user,
            ip_address='8.8.8.8',
            reputation_score=72,
            risk_level='medium',
            is_proxy=False,
            is_hosting=True,
            is_mobile=False,
            risk_factors=['Hosting provider'],
            geolocation={'country': 'United States'},
            network={'isp': 'Google'},
        )

        response = self.client.delete(f'/ip-tools/history/{scan.id}/')

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(IPReputationScan.objects.filter(id=scan.id).exists())

    def test_delete_scan_history_entry_is_scoped_to_authenticated_user(self):
        scan = IPReputationScan.objects.create(
            user=self.other_user,
            ip_address='1.1.1.1',
            reputation_score=91,
            risk_level='low',
            is_proxy=False,
            is_hosting=False,
            is_mobile=False,
            risk_factors=[],
            geolocation={'country': 'Australia'},
            network={'isp': 'Cloudflare'},
        )

        response = self.client.delete(f'/ip-tools/history/{scan.id}/')

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(IPReputationScan.objects.filter(id=scan.id).exists())
