import logging
from smtplib import SMTPException

import requests
from django.conf import settings
from django.core.mail import send_mail

from accounts.models import UserSettings

from .models import NotificationEvent

logger = logging.getLogger(__name__)
DEFAULT_ASSET_TEST_ALERT_THRESHOLD = 70
WEBHOOK_TIMEOUT_SECONDS = 5


def _build_test_label(test_type: str) -> str:
    return dict(NotificationEvent.TestTypes.choices).get(test_type, test_type)


def _build_notification_message(notification: NotificationEvent) -> str:
    asset_label = notification.asset.value if notification.asset else 'Unknown asset'
    return (
        f'{notification.title}\n\n'
        f'- Asset: {asset_label}\n'
        f'- Test type: {_build_test_label(notification.test_type)}\n'
        f'- Score: {notification.score}/100 (threshold {notification.threshold})\n\n'
        f'{notification.detail}'
    )


def _send_email_if_enabled(notification: NotificationEvent, user_settings: UserSettings):
    if not user_settings.notifications_email_enabled:
        notification.email_status = NotificationEvent.DeliveryStatuses.DISABLED
        return

    if not notification.user.email:
        notification.email_status = NotificationEvent.DeliveryStatuses.FAILED
        return

    message = _build_notification_message(notification)

    try:
        send_mail(
            subject=f'[CyberSentry] {notification.title}',
            message=message,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'admin@localhost'),
            recipient_list=[notification.user.email],
            fail_silently=False,
        )
    except (ConnectionRefusedError, OSError, SMTPException):
        notification.email_status = NotificationEvent.DeliveryStatuses.FAILED
        logger.warning(
            'Notification email could not be delivered; continuing without email channel',
            extra={'notification_id': notification.id},
        )
        return
    except Exception:
        notification.email_status = NotificationEvent.DeliveryStatuses.FAILED
        logger.exception('Unexpected email delivery failure', extra={'notification_id': notification.id})
        return

    notification.email_status = NotificationEvent.DeliveryStatuses.SENT


def _post_webhook(url: str, payload: dict):
    response = requests.post(url, json=payload, timeout=WEBHOOK_TIMEOUT_SECONDS)
    response.raise_for_status()


def _build_teams_message_card(notification: NotificationEvent) -> dict:
    """Build a Teams-compatible Message Card payload."""
    asset_label = notification.asset.value if notification.asset else 'Unknown asset'
    severity_color = {
        NotificationEvent.Severities.LOW: '0078D4',      # Blue
        NotificationEvent.Severities.MEDIUM: 'FFB900',   # Amber
        NotificationEvent.Severities.HIGH: 'C50F1F',     # Red
    }.get(notification.severity, '0078D4')

    return {
        '@type': 'MessageCard',
        '@context': 'https://schema.org/extensions',
        'summary': notification.title,
        'themeColor': severity_color,
        'title': notification.title,
        'sections': [
            {
                'activityTitle': f'Asset: {asset_label}',
                'facts': [
                    {'name': 'Test Type', 'value': _build_test_label(notification.test_type)},
                    {'name': 'Score', 'value': f'{notification.score}/100'},
                    {'name': 'Threshold', 'value': str(notification.threshold)},
                    {'name': 'Severity', 'value': notification.severity},
                ],
                'text': notification.detail,
            }
        ],
    }


def _send_webhooks_if_enabled(notification: NotificationEvent, user_settings: UserSettings):
    if not user_settings.notifications_webhook_enabled:
        notification.webhook_status = NotificationEvent.DeliveryStatuses.DISABLED
        return

    webhook_urls = [
        value.strip()
        for value in [user_settings.slack_webhook_url, user_settings.teams_webhook_url]
        if value and value.strip()
    ]

    if not webhook_urls:
        notification.webhook_status = NotificationEvent.DeliveryStatuses.FAILED
        return

    # Build Teams Message Card format (compatible with Teams workflow webhooks)
    payload = _build_teams_message_card(notification)

    for webhook_url in webhook_urls:
        _post_webhook(webhook_url, payload)

    notification.webhook_status = NotificationEvent.DeliveryStatuses.SENT


def dispatch_asset_test_notification(*, user, asset, test_type: str, score: int, detail: str, metadata=None):
    normalized_score = max(0, min(100, int(score)))
    organization = getattr(asset, 'organization', None) or getattr(user, 'organization', None)
    threshold = (
        int(organization.notification_alert_threshold)
        if organization is not None
        else DEFAULT_ASSET_TEST_ALERT_THRESHOLD
    )

    if normalized_score < threshold:
        return None

    severity = NotificationEvent.Severities.HIGH
    title = f'Critical test result for {asset.name}'

    notification = NotificationEvent.objects.create(
        organization=asset.organization,
        user=user,
        asset=asset,
        test_type=test_type,
        severity=severity,
        score=normalized_score,
        threshold=threshold,
        title=title,
        detail=detail,
        metadata=metadata or {},
    )

    user_settings, _ = UserSettings.objects.get_or_create(user=user)

    _send_email_if_enabled(notification, user_settings)

    try:
        _send_webhooks_if_enabled(notification, user_settings)
    except Exception:
        logger.exception('Failed to send notification webhook', extra={'notification_id': notification.id})
        notification.webhook_status = NotificationEvent.DeliveryStatuses.FAILED

    notification.save(update_fields=['email_status', 'webhook_status'])
    return notification

