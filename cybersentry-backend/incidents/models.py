from django.conf import settings
from django.db import models
from django.utils import timezone


class IncidentTicket(models.Model):
    class Sources(models.TextChoices):
        MANUAL = 'manual', 'Manual'
        AUTOMATED = 'automated', 'Automated'
        EXTERNAL_INTEGRATION = 'external_integration', 'External integration'

    class Statuses(models.TextChoices):
        NEW = 'new', 'New'
        TRIAGED = 'triaged', 'Triaged'
        IN_PROGRESS = 'in_progress', 'In progress'
        ON_HOLD = 'on_hold', 'On hold'
        RESOLVED = 'resolved', 'Resolved'
        CLOSED = 'closed', 'Closed'

    class Priorities(models.TextChoices):
        LOW = 'low', 'Low'
        MEDIUM = 'medium', 'Medium'
        HIGH = 'high', 'High'
        CRITICAL = 'critical', 'Critical'

    class Severities(models.TextChoices):
        INFORMATIONAL = 'informational', 'Informational'
        LOW = 'low', 'Low'
        MEDIUM = 'medium', 'Medium'
        HIGH = 'high', 'High'
        CRITICAL = 'critical', 'Critical'

    class ImpactLevels(models.TextChoices):
        NONE = 'none', 'None'
        LOW = 'low', 'Low'
        MEDIUM = 'medium', 'Medium'
        HIGH = 'high', 'High'
        WIDESPREAD = 'widespread', 'Widespread'

    class UrgencyLevels(models.TextChoices):
        LOW = 'low', 'Low'
        MEDIUM = 'medium', 'Medium'
        HIGH = 'high', 'High'
        IMMEDIATE = 'immediate', 'Immediate'

    class SlaPolicies(models.TextChoices):
        NONE = 'none', 'No SLA'
        BRONZE = 'bronze', 'Bronze'
        SILVER = 'silver', 'Silver'
        GOLD = 'gold', 'Gold'
        PLATINUM = 'platinum', 'Platinum'
        CUSTOM = 'custom', 'Custom'

    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='incident_tickets',
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_incident_tickets',
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='updated_incident_tickets',
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_incident_tickets',
    )

    source = models.CharField(max_length=32, choices=Sources.choices, default=Sources.MANUAL)
    source_event_id = models.CharField(max_length=128, blank=True)
    deduplication_key = models.CharField(max_length=128, blank=True)

    title = models.CharField(max_length=255)
    short_code = models.CharField(max_length=32, blank=True)
    description = models.TextField(blank=True)
    incident_type = models.CharField(max_length=80, blank=True)
    category = models.CharField(max_length=80, blank=True)
    subcategory = models.CharField(max_length=80, blank=True)
    affected_asset = models.CharField(max_length=255, blank=True)

    status = models.CharField(max_length=24, choices=Statuses.choices, default=Statuses.NEW)
    priority = models.CharField(max_length=16, choices=Priorities.choices, default=Priorities.MEDIUM)
    severity = models.CharField(max_length=16, choices=Severities.choices, default=Severities.MEDIUM)
    impact = models.CharField(max_length=16, choices=ImpactLevels.choices, default=ImpactLevels.LOW)
    urgency = models.CharField(max_length=16, choices=UrgencyLevels.choices, default=UrgencyLevels.MEDIUM)

    sla_policy = models.CharField(max_length=16, choices=SlaPolicies.choices, default=SlaPolicies.NONE)
    first_response_target_at = models.DateTimeField(null=True, blank=True)
    first_response_at = models.DateTimeField(null=True, blank=True)
    resolution_target_at = models.DateTimeField(null=True, blank=True)
    due_at = models.DateTimeField(null=True, blank=True)

    reported_at = models.DateTimeField(default=timezone.now)
    detected_at = models.DateTimeField(null=True, blank=True)
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    last_status_change_at = models.DateTimeField(default=timezone.now)

    environment = models.CharField(max_length=50, blank=True)
    reporter_email = models.EmailField(blank=True)
    customer_impact = models.TextField(blank=True)
    mitigation = models.TextField(blank=True)
    root_cause = models.TextField(blank=True)
    resolution_summary = models.TextField(blank=True)
    tags = models.JSONField(default=list, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['organization', 'status']),
            models.Index(fields=['organization', 'priority']),
            models.Index(fields=['organization', 'severity']),
            models.Index(fields=['organization', 'sla_policy']),
            models.Index(fields=['organization', '-due_at']),
            models.Index(fields=['organization', '-created_at']),
            models.Index(fields=['source', 'source_event_id']),
        ]

    def __str__(self):
        return self.title

    @property
    def is_terminal(self) -> bool:
        return self.status in {self.Statuses.RESOLVED, self.Statuses.CLOSED}

    def compute_sla_state(self, warning_window_hours: int = 4) -> str:
        if self.is_terminal or not self.due_at:
            return 'not_applicable'

        now = timezone.now()
        if self.due_at <= now:
            return 'breached'

        warning_threshold = now + timezone.timedelta(hours=warning_window_hours)
        if self.due_at <= warning_threshold:
            return 'at_risk'

        return 'on_track'


class IncidentComment(models.Model):
    """Comments on incident tickets"""

    ticket = models.ForeignKey(
        IncidentTicket,
        on_delete=models.CASCADE,
        related_name='comments',
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='incident_comments',
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['ticket', '-created_at']),
            models.Index(fields=['author', '-created_at']),
        ]

    def __str__(self):
        return f"Comment on {self.ticket.title} by {self.author.email}"
