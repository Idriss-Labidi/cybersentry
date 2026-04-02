from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone


class NotificationEvent(models.Model):
    class TestTypes(models.TextChoices):
        DNS_HEALTH = 'dns_health', 'DNS health check'
        IP_REPUTATION = 'ip_reputation', 'IP reputation check'
        GITHUB_HEALTH = 'github_health', 'GitHub health check'

    class Severities(models.TextChoices):
        LOW = 'low', 'Low'
        MEDIUM = 'medium', 'Medium'
        HIGH = 'high', 'High'

    class DeliveryStatuses(models.TextChoices):
        PENDING = 'pending', 'Pending'
        SENT = 'sent', 'Sent'
        FAILED = 'failed', 'Failed'
        DISABLED = 'disabled', 'Disabled'

    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='notification_events',
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notification_events',
    )
    asset = models.ForeignKey(
        'assets.Asset',
        on_delete=models.CASCADE,
        related_name='notification_events',
        null=True,
        blank=True,
    )
    test_type = models.CharField(max_length=32, choices=TestTypes.choices)
    severity = models.CharField(max_length=16, choices=Severities.choices, default=Severities.HIGH)
    score = models.PositiveSmallIntegerField(validators=[MinValueValidator(0), MaxValueValidator(100)])
    threshold = models.PositiveSmallIntegerField(validators=[MinValueValidator(0), MaxValueValidator(100)])
    title = models.CharField(max_length=255)
    detail = models.TextField()
    metadata = models.JSONField(default=dict)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    email_status = models.CharField(
        max_length=16,
        choices=DeliveryStatuses.choices,
        default=DeliveryStatuses.PENDING,
    )
    webhook_status = models.CharField(
        max_length=16,
        choices=DeliveryStatuses.choices,
        default=DeliveryStatuses.PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['organization', 'user', '-created_at']),
            models.Index(fields=['organization', 'is_read']),
            models.Index(fields=['test_type', 'severity']),
        ]

    def mark_read(self):
        if self.is_read:
            return

        self.is_read = True
        self.read_at = timezone.now()
        self.save(update_fields=['is_read', 'read_at'])

    def __str__(self):
        return self.title

