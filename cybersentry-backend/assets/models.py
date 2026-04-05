from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class AssetTag(models.Model):
    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='asset_tags',
    )
    name = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        unique_together = ('organization', 'name')

    def __str__(self):
        return self.name


class Asset(models.Model):
    class AssetTypes(models.TextChoices):
        DOMAIN = 'domain', 'Domain'
        IP = 'ip', 'IP'
        WEBSITE = 'website', 'Website'
        GITHUB_REPOSITORY = 'github_repo', 'GitHub Repository'

    class Categories(models.TextChoices):
        PRODUCTION = 'production', 'Production'
        DEVELOPMENT = 'development', 'Development'
        TEST = 'test', 'Test'

    class Statuses(models.TextChoices):
        ACTIVE = 'active', 'Active'
        PAUSED = 'paused', 'Paused'
        ARCHIVED = 'archived', 'Archived'

    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='assets',
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_assets',
    )
    name = models.CharField(max_length=255)
    asset_type = models.CharField(max_length=20, choices=AssetTypes.choices)
    value = models.CharField(max_length=255)
    category = models.CharField(
        max_length=20,
        choices=Categories.choices,
        default=Categories.PRODUCTION,
    )
    status = models.CharField(
        max_length=20,
        choices=Statuses.choices,
        default=Statuses.ACTIVE,
    )
    description = models.TextField(blank=True)
    risk_score = models.PositiveSmallIntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    last_scanned_at = models.DateTimeField(null=True, blank=True)
    tags = models.ManyToManyField(AssetTag, blank=True, related_name='assets')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name', 'value']
        unique_together = ('organization', 'asset_type', 'value')
        indexes = [
            models.Index(fields=['organization', 'asset_type']),
            models.Index(fields=['organization', 'category']),
            models.Index(fields=['organization', 'status']),
            models.Index(fields=['organization', 'risk_score']),
        ]

    def __str__(self):
        return f'{self.name} ({self.asset_type})'


class AssetRiskSnapshot(models.Model):
    asset = models.ForeignKey(
        Asset,
        on_delete=models.CASCADE,
        related_name='risk_snapshots',
    )
    score = models.PositiveSmallIntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    source = models.CharField(max_length=100, default='manual')
    note = models.CharField(max_length=255, blank=True)
    calculated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-calculated_at']
        indexes = [
            models.Index(fields=['asset', '-calculated_at']),
        ]

    def __str__(self):
        return f'{self.asset.name} - {self.score}/100'


class AssetDnsSnapshot(models.Model):
    class Statuses(models.TextChoices):
        SUCCESS = 'success', 'Success'
        FAILED = 'failed', 'Failed'

    asset = models.ForeignKey(
        Asset,
        on_delete=models.CASCADE,
        related_name='dns_snapshots',
    )
    status = models.CharField(max_length=16, choices=Statuses.choices, default=Statuses.SUCCESS)
    record_types = models.JSONField(default=list)
    records = models.JSONField(default=dict)
    error_message = models.CharField(max_length=255, blank=True)
    scanned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-scanned_at']
        indexes = [
            models.Index(fields=['asset', '-scanned_at']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f'{self.asset.name} DNS snapshot @ {self.scanned_at:%Y-%m-%d %H:%M:%S}'


class AssetDnsChangeEvent(models.Model):
    class ChangeTypes(models.TextChoices):
        ADDED = 'added', 'Added'
        REMOVED = 'removed', 'Removed'
        MODIFIED = 'modified', 'Modified'
        STATUS = 'status', 'Status'

    class Severities(models.TextChoices):
        LOW = 'low', 'Low'
        MEDIUM = 'medium', 'Medium'
        HIGH = 'high', 'High'

    asset = models.ForeignKey(
        Asset,
        on_delete=models.CASCADE,
        related_name='dns_change_events',
    )
    snapshot = models.ForeignKey(
        AssetDnsSnapshot,
        on_delete=models.CASCADE,
        related_name='change_events',
    )
    record_type = models.CharField(max_length=32)
    change_type = models.CharField(max_length=16, choices=ChangeTypes.choices)
    severity = models.CharField(max_length=16, choices=Severities.choices, default=Severities.LOW)
    summary = models.CharField(max_length=255)
    previous_value = models.JSONField(default=list)
    current_value = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['asset', '-created_at']),
            models.Index(fields=['severity']),
        ]

    def __str__(self):
        return self.summary


class AssetAlert(models.Model):
    class AlertTypes(models.TextChoices):
        DNS_CHANGE = 'dns_change', 'DNS change'
        WEBSITE_CONTENT_CHANGE = 'website_content_change', 'Website content change'
        GITHUB_SECRET_EXPOSURE = 'github_secret_exposure', 'GitHub secret exposure'

    class Severities(models.TextChoices):
        LOW = 'low', 'Low'
        MEDIUM = 'medium', 'Medium'
        HIGH = 'high', 'High'

    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='asset_alerts',
    )
    asset = models.ForeignKey(
        Asset,
        on_delete=models.CASCADE,
        related_name='alerts',
    )
    alert_type = models.CharField(max_length=32, choices=AlertTypes.choices)
    severity = models.CharField(max_length=16, choices=Severities.choices, default=Severities.LOW)
    title = models.CharField(max_length=255)
    detail = models.TextField()
    metadata = models.JSONField(default=dict)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['organization', '-created_at']),
            models.Index(fields=['asset', '-created_at']),
            models.Index(fields=['is_read']),
        ]

    def __str__(self):
        return self.title


class AssetWebsiteSnapshot(models.Model):
    class Statuses(models.TextChoices):
        SUCCESS = 'success', 'Success'
        FAILED = 'failed', 'Failed'

    asset = models.ForeignKey(
        Asset,
        on_delete=models.CASCADE,
        related_name='website_snapshots',
    )
    status = models.CharField(max_length=16, choices=Statuses.choices, default=Statuses.SUCCESS)
    response_code = models.PositiveSmallIntegerField(null=True, blank=True)
    content_hash = models.CharField(max_length=64, blank=True)
    page_title = models.CharField(max_length=255, blank=True)
    content_length = models.PositiveIntegerField(default=0)
    error_message = models.CharField(max_length=255, blank=True)
    scanned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-scanned_at']
        indexes = [
            models.Index(fields=['asset', '-scanned_at']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f'{self.asset.name} website snapshot @ {self.scanned_at:%Y-%m-%d %H:%M:%S}'


class AssetWebsiteChangeEvent(models.Model):
    class ChangeTypes(models.TextChoices):
        CONTENT = 'content', 'Content changed'
        TITLE = 'title', 'Page title changed'
        STATUS = 'status', 'Availability/status changed'

    class Severities(models.TextChoices):
        LOW = 'low', 'Low'
        MEDIUM = 'medium', 'Medium'
        HIGH = 'high', 'High'

    asset = models.ForeignKey(
        Asset,
        on_delete=models.CASCADE,
        related_name='website_change_events',
    )
    snapshot = models.ForeignKey(
        AssetWebsiteSnapshot,
        on_delete=models.CASCADE,
        related_name='change_events',
    )
    change_type = models.CharField(max_length=16, choices=ChangeTypes.choices)
    severity = models.CharField(max_length=16, choices=Severities.choices, default=Severities.MEDIUM)
    summary = models.CharField(max_length=255)
    previous_value = models.JSONField(default=dict)
    current_value = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['asset', '-created_at']),
            models.Index(fields=['severity']),
        ]

    def __str__(self):
        return self.summary


class AssetAutomatedScanRun(models.Model):
    class ScanTypes(models.TextChoices):
        DNS = 'dns', 'DNS'
        IP = 'ip', 'IP reputation'
        WEBSITE = 'website', 'Website'
        GITHUB = 'github', 'GitHub'

    class Statuses(models.TextChoices):
        SUCCESS = 'success', 'Success'
        FAILED = 'failed', 'Failed'
        SKIPPED = 'skipped', 'Skipped'

    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='asset_automated_scan_runs',
    )
    asset = models.ForeignKey(
        Asset,
        on_delete=models.CASCADE,
        related_name='automated_scan_runs',
    )
    scan_type = models.CharField(max_length=16, choices=ScanTypes.choices)
    status = models.CharField(max_length=16, choices=Statuses.choices, default=Statuses.SUCCESS)
    score = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        null=True,
        blank=True,
    )
    detail = models.CharField(max_length=255, blank=True)
    metadata = models.JSONField(default=dict)
    scanned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-scanned_at']
        indexes = [
            models.Index(fields=['organization', '-scanned_at']),
            models.Index(fields=['asset', '-scanned_at']),
            models.Index(fields=['scan_type', 'status']),
        ]

    def __str__(self):
        return f'{self.asset.name} [{self.scan_type}] @ {self.scanned_at:%Y-%m-%d %H:%M:%S}'


