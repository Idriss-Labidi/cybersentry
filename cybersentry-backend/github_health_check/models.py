from django.db import models
from accounts.models import Organization, User

class GithubRepository(models.Model):

    # Stores GitHub repository information linked to an organization.
    owner = models.CharField(max_length=255)
    name = models.CharField(max_length=255)
    url = models.URLField(unique=True)
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='github_repositories'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_check_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('owner', 'name', 'organization')
        ordering = ['-last_check_at']

    def __str__(self):
        return f"{self.owner}/{self.name}"


class RepositoryCheckResult(models.Model):

    # Stores the results of a repository health check.
    repository = models.ForeignKey(
        GithubRepository,
        on_delete=models.CASCADE,
        related_name='check_results'
    )
    checked_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='github_checks'
    )

    # Risk score (0-100)
    risk_score = models.IntegerField(default=0)

    # Level-specific data
    level1_data = models.JSONField(default=dict, blank=True)  # REST API metrics
    level2_data = models.JSONField(default=dict, blank=True)  # File inspection
    level3_data = models.JSONField(default=dict, blank=True)  # Security APIs

    # Summary and recommendations
    summary = models.TextField(blank=True)
    warnings = models.JSONField(default=list, blank=True)  # List of warning objects
    recommendations = models.JSONField(default=list, blank=True)  # List of recommendations

    check_timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-check_timestamp']

    def __str__(self):
        return f"{self.repository} - Score: {self.risk_score}"
