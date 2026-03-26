from django.contrib.auth import get_user_model
from oauth2_provider.models import AccessToken, Application
from rest_framework import status
from rest_framework.test import APITestCase
from django.utils import timezone
from datetime import timedelta

from accounts.models import Organization
from .models import Asset


class AssetApiTests(APITestCase):
    def setUp(self):
        self.organization = Organization.objects.create(
            name='CyberSentry',
            contact_email='contact@cybersentry.test',
            allowed_domains='cybersentry.test',
        )
        self.user = get_user_model().objects.create_user(
            username='analyst',
            email='analyst@cybersentry.test',
            password='StrongPassword123!',
            organization=self.organization,
        )
        self.application = Application.objects.create(
            name='Test App',
            client_type=Application.CLIENT_PUBLIC,
            authorization_grant_type=Application.GRANT_PASSWORD,
            user=self.user,
        )
        self.token = AccessToken.objects.create(
            user=self.user,
            scope='read write',
            expires=timezone.now() + timedelta(hours=1),
            token='test-access-token',
            application=self.application,
        )
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token.token}')

    def test_create_asset_with_tags(self):
        response = self.client.post(
            '/api/assets/',
            {
                'name': 'Main Website',
                'asset_type': 'website',
                'value': 'https://app.cybersentry.test',
                'category': 'production',
                'status': 'active',
                'description': 'Main customer-facing application',
                'tag_names': ['customer-facing', 'critical'],
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Asset.objects.count(), 1)
        self.assertEqual(Asset.objects.first().tags.count(), 2)

    def test_summary_returns_asset_counts(self):
        Asset.objects.create(
            organization=self.organization,
            created_by=self.user,
            name='API Domain',
            asset_type='domain',
            value='api.cybersentry.test',
            category='production',
            risk_score=72,
        )

        response = self.client.get('/api/assets/summary/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_assets'], 1)
        self.assertEqual(response.data['high_risk_assets'], 1)

    def test_create_asset_auto_provisions_personal_workspace(self):
        self.user.organization = None
        self.user.save(update_fields=['organization'])

        response = self.client.post(
            '/api/assets/',
            {
                'name': 'Primary Domain',
                'asset_type': 'domain',
                'value': 'example.test',
                'category': 'production',
                'status': 'active',
                'description': 'Organization-less user bootstrap',
                'tag_names': ['external'],
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.user.refresh_from_db()
        self.assertIsNotNone(self.user.organization_id)
        self.assertEqual(Asset.objects.get().organization_id, self.user.organization_id)
