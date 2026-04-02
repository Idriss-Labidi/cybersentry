from unittest.mock import patch

from django.contrib.auth import get_user_model
from oauth2_provider.models import AccessToken, Application
from rest_framework import status
from rest_framework.test import APITestCase
from django.utils import timezone
from datetime import timedelta

from accounts.models import Organization, UserSettings
from assets.models import Asset

from .models import NotificationEvent
from .services import dispatch_asset_test_notification


class NotificationDispatchTests(APITestCase):
    def setUp(self):
        self.organization = Organization.objects.create(
            name='Notification Org',
            contact_email='contact@notify.test',
            allowed_domains='notify.test',
        )
        self.user = get_user_model().objects.create_user(
            username='notify-user',
            email='notify@notify.test',
            password='StrongPassword123!',
            organization=self.organization,
        )
        self.asset = Asset.objects.create(
            organization=self.organization,
            created_by=self.user,
            name='Gateway IP',
            asset_type=Asset.AssetTypes.IP,
            value='8.8.8.8',
            category=Asset.Categories.PRODUCTION,
            risk_score=50,
        )

    @patch('notifications.services.requests.post')
    @patch('notifications.services.send_mail')
    def test_dispatch_creates_event_and_sends_enabled_channels(self, send_mail_mock, post_mock):
        settings_obj = UserSettings.objects.get(user=self.user)
        settings_obj.notifications_email_enabled = True
        settings_obj.notifications_webhook_enabled = True
        settings_obj.slack_webhook_url = 'https://hooks.slack.test/services/abc'
        settings_obj.teams_webhook_url = 'https://hooks.teams.test/services/xyz'
        settings_obj.save()

        notification = dispatch_asset_test_notification(
            user=self.user,
            asset=self.asset,
            test_type=NotificationEvent.TestTypes.IP_REPUTATION,
            score=12,
            detail='IP reputation dropped below threshold.',
            metadata={'source': 'test'},
        )

        self.assertIsNotNone(notification)
        self.assertEqual(NotificationEvent.objects.count(), 1)
        self.assertEqual(notification.email_status, NotificationEvent.DeliveryStatuses.SENT)
        self.assertEqual(notification.webhook_status, NotificationEvent.DeliveryStatuses.SENT)
        send_mail_mock.assert_called_once()
        self.assertEqual(post_mock.call_count, 2)

    @patch('notifications.services.requests.post')
    @patch('notifications.services.send_mail', side_effect=ConnectionRefusedError('SMTP unavailable'))
    def test_dispatch_handles_smtp_connection_failure_gracefully(self, send_mail_mock, post_mock):
        settings_obj = UserSettings.objects.get(user=self.user)
        settings_obj.notifications_email_enabled = True
        settings_obj.notifications_webhook_enabled = True
        settings_obj.slack_webhook_url = 'https://hooks.slack.test/services/abc'
        settings_obj.save()

        notification = dispatch_asset_test_notification(
            user=self.user,
            asset=self.asset,
            test_type=NotificationEvent.TestTypes.IP_REPUTATION,
            score=12,
            detail='IP reputation dropped below threshold.',
            metadata={'source': 'test'},
        )

        self.assertIsNotNone(notification)
        self.assertEqual(NotificationEvent.objects.count(), 1)
        self.assertEqual(notification.email_status, NotificationEvent.DeliveryStatuses.FAILED)
        self.assertEqual(notification.webhook_status, NotificationEvent.DeliveryStatuses.SENT)
        send_mail_mock.assert_called_once()
        self.assertEqual(post_mock.call_count, 1)

    @patch('notifications.services.send_mail')
    def test_dispatch_skips_above_threshold(self, send_mail_mock):
        notification = dispatch_asset_test_notification(
            user=self.user,
            asset=self.asset,
            test_type=NotificationEvent.TestTypes.IP_REPUTATION,
            score=45,
            detail='No alert should be created.',
        )

        self.assertIsNone(notification)
        self.assertEqual(NotificationEvent.objects.count(), 0)
        send_mail_mock.assert_not_called()


class NotificationApiTests(APITestCase):
    def setUp(self):
        self.organization = Organization.objects.create(
            name='Api Notification Org',
            contact_email='contact@apinotify.test',
            allowed_domains='apinotify.test',
        )
        self.user = get_user_model().objects.create_user(
            username='api-notify-user',
            email='api@apinotify.test',
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
            token='notifications-api-token',
            application=self.application,
        )
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token.token}')

        for index in range(3):
            NotificationEvent.objects.create(
                organization=self.organization,
                user=self.user,
                test_type=NotificationEvent.TestTypes.DNS_HEALTH,
                severity=NotificationEvent.Severities.HIGH,
                score=10 + index,
                threshold=30,
                title=f'Alert {index}',
                detail='Test alert',
                is_read=index == 0,
            )

    def test_summary_returns_unread_counts(self):
        response = self.client.get('/api/notifications/summary/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total'], 3)
        self.assertEqual(response.data['unread'], 2)

    def test_mark_read_updates_notification(self):
        notification = NotificationEvent.objects.filter(is_read=False).first()

        response = self.client.post(f'/api/notifications/{notification.id}/mark_read/', {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        notification.refresh_from_db()
        self.assertTrue(notification.is_read)

    def test_mark_all_read_updates_all_unread_notifications(self):
        response = self.client.post('/api/notifications/mark_all_read/', {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['updated'], 2)
        self.assertEqual(NotificationEvent.objects.filter(is_read=False).count(), 0)

