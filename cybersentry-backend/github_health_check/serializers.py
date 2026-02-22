"""
Serializers for GitHub health check feature
Analogous to Spring Boot DTO classes and model mappers
"""

import re
from rest_framework import serializers
from .models import GithubRepository, RepositoryCheckResult


def validate_url(value):

    # Validate GitHub URL format: https://github.com/owner/repo
    github_pattern = r'^https://github\.com/([a-zA-Z0-9_-]+)/([a-zA-Z0-9_.-]+)/?$'

    if not re.match(github_pattern, value):
        raise serializers.ValidationError(
            "Invalid GitHub URL. Expected format: https://github.com/owner/repo"
        )

    return value


class GitHubRepositorySerializer(serializers.ModelSerializer):

    # Serializer for GithubRepository model : Handles URL validation and extraction of owner/repo
    class Meta:
        model = GithubRepository
        fields = ['id', 'owner', 'name', 'url', 'organization', 'created_at', 'last_check_at']
        read_only_fields = ['id', 'created_at', 'last_check_at', 'owner', 'name']

    def create(self, validated_data):

        # Extract owner and repo from URL before creating instance
        url = validated_data.get('url')
        github_pattern = r'^https://github\.com/([a-zA-Z0-9_-]+)/([a-zA-Z0-9_.-]+)/?$'
        match = re.match(github_pattern, url)

        if match:
            validated_data['owner'] = match.group(1)
            validated_data['name'] = match.group(2)

        return super().create(validated_data)


class CheckResultDetailSerializer(serializers.ModelSerializer):

    # Detailed serializer for RepositoryCheckResult with all data
    repository = GitHubRepositorySerializer(read_only=True)

    class Meta:
        model = RepositoryCheckResult
        fields = [
            'id', 'repository', 'risk_score', 'level1_data', 'level2_data',
            'level3_data', 'summary', 'warnings', 'recommendations', 'check_timestamp'
        ]
        read_only_fields = ['id', 'check_timestamp']


def get_risk_category(obj) -> str:
    #Convert risk score to category
    if obj.risk_score < 25:
        return "Low Risk"
    elif obj.risk_score < 50:
        return "Medium Risk"
    elif obj.risk_score < 75:
        return "High Risk"
    else:
        return "Critical Risk"


class CheckResultSummarySerializer(serializers.ModelSerializer):

    # Summary serializer for RepositoryCheckResult (lightweight)
    repository_url = serializers.CharField(source='repository.url', read_only=True)
    repository_name = serializers.CharField(source='repository.name', read_only=True)
    risk_category = serializers.SerializerMethodField()

    class Meta:
        model = RepositoryCheckResult
        fields = [
            'id', 'repository_url', 'repository_name', 'risk_score',
            'risk_category', 'summary', 'check_timestamp'
        ]


class CheckRepositoryInputSerializer(serializers.Serializer):

    # Input serializer for check repository endpoint
    url = serializers.URLField(
        help_text="GitHub repository URL (e.g., https://github.com/owner/repo)"
    )
    levels = serializers.MultipleChoiceField(
        choices=['1', '2', '3'],
        default=['1', '2', '3'],
        help_text="Which check levels to run (1=REST API, 2=File Inspection, 3=Security APIs)"
    )
    use_cache = serializers.BooleanField(
        default=True,
        help_text="Use cached results if available (older than 1 hour)"
    )
    github_token = serializers.CharField(
        required=False,
        allow_blank=True,
        write_only=True,
        help_text="Optional personal GitHub token for higher rate limits"
    )

