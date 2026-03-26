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

