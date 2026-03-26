from datetime import timedelta
import re

from django.db.models import Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import GithubRepository, RepositoryCheckResult
from accounts.models import UserSettings
from accounts.services import ensure_user_organization
from .serializers import (
    GitHubRepositorySerializer,
    CheckResultDetailSerializer,
    CheckResultSummarySerializer,
    CheckRepositoryInputSerializer,
)
from .github_health_service import Level1Service, Level2Service, Level3Service, RiskScoringEngine


# ============= Private method =============
def _run_checks(owner: str, repo: str, levels: list, token: str = None) -> dict:
    """
    Run requested check levels
    ~ Equivalent to Spring Boot service method calling multiple repositories
    """
    result = {}

    try:
        if 1 in levels:
            level1_service = Level1Service(token=token)
            result['level1'] = level1_service.check_repository(owner, repo)

            # If Level 1 errors out, return early
            if "error" in result['level1']:
                return result

        if 2 in levels:
            level2_service = Level2Service(token=token)
            result['level2'] = level2_service.check_files(owner, repo)

        if 3 in levels:
            level3_service = Level3Service(token=token)
            result['level3'] = level3_service.check_security_alerts(owner, repo)

    except Exception as e:
        return {"error": f"Unexpected error during checks: {str(e)}"}

    return result


def normalize_github_repository_url(url: str) -> str:
    return url.strip().rstrip('/')


def _match_repository_by_url(url: str, organization):
    normalized_url = normalize_github_repository_url(url)
    return GithubRepository.objects.filter(
        organization=organization,
    ).filter(
        Q(url=normalized_url) | Q(url=f'{normalized_url}/')
    ).first()


def run_repository_health_check(*, user, url: str, levels=None, use_cache=None, github_token: str = None):
    normalized_url = normalize_github_repository_url(url)
    normalized_levels = [int(level) for level in (levels or ['1', '2', '3'])]

    user_settings, _ = UserSettings.objects.get_or_create(user=user)
    if use_cache is None:
        use_cache = user_settings.use_cache

    user_token = github_token or user_settings.github_token or None
    cache_duration = user_settings.cache_duration

    github_pattern = r'^https://github\.com/([a-zA-Z0-9_-]+)/([a-zA-Z0-9_.-]+)$'
    match = re.match(github_pattern, normalized_url)

    if not match:
        return {"error": "Invalid GitHub URL format"}, status.HTTP_400_BAD_REQUEST

    owner, repo = match.groups()
    organization = ensure_user_organization(user)

    try:
        github_repo, _ = GithubRepository.objects.get_or_create(
            url=normalized_url,
            owner=owner,
            name=repo,
            organization=organization,
        )
    except GithubRepository.MultipleObjectsReturned:
        github_repo = _match_repository_by_url(normalized_url, organization)

    if use_cache:
        recent_result = github_repo.check_results.filter(
            check_timestamp__gte=timezone.now() - timedelta(minutes=cache_duration)
        ).first()

        if recent_result:
            return (
                {
                    "message": f"Using cached result (less than {cache_duration} minutes old)",
                    "result": CheckResultDetailSerializer(recent_result).data,
                },
                status.HTTP_200_OK,
            )

    result_data = _run_checks(owner, repo, normalized_levels, user_token)

    if "error" in result_data and "Repository not found" in result_data["error"]:
        return result_data, status.HTTP_404_NOT_FOUND

    if "error" in result_data:
        return result_data, status.HTTP_400_BAD_REQUEST

    level1_data = result_data.get('level1', {})
    level2_data = result_data.get('level2', {})
    level3_data = result_data.get('level3', {})

    risk_score, score_breakdown = RiskScoringEngine.calculate_score(
        level1_data, level2_data, level3_data
    )
    risk_category = RiskScoringEngine.generate_risk_category(risk_score)
    warnings = RiskScoringEngine.generate_warnings(level1_data, level2_data, level3_data)
    recommendations = RiskScoringEngine.generate_recommendations(level1_data, level2_data, level3_data)

    check_result = RepositoryCheckResult.objects.create(
        repository=github_repo,
        checked_by=user,
        risk_score=risk_score,
        level1_data=level1_data,
        level2_data=level2_data,
        level3_data=level3_data,
        summary=f"{risk_category} - Score: {risk_score}/100",
        warnings=warnings,
        recommendations=recommendations,
    )

    github_repo.last_check_at = timezone.now()
    github_repo.save(update_fields=['last_check_at'])

    return (
        {
            "result": CheckResultDetailSerializer(check_result).data,
            "score_breakdown": score_breakdown,
            "risk_category": risk_category,
        },
        status.HTTP_201_CREATED,
    )


class GitHubRepositoryCheckViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def _get_user_organization(self, request):
        return ensure_user_organization(request.user)

    @action(detail=False, methods=['post'])
    def check_repository(self, request):
        """
        POST /github-health/check-repository/

        Check a GitHub repository health and return risk score.

        Body: {
            "url": "https://github.com/owner/repo",
            "levels": ["1", "2", "3"],  # Optional
            "use_cache": true,
            "github_token": "ghp_..."  # Optional
        }
        """
        serializer = CheckRepositoryInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        payload, response_status = run_repository_health_check(
            user=request.user,
            url=serializer.validated_data['url'],
            levels=serializer.validated_data.get('levels', ['1', '2', '3']),
            use_cache=serializer.validated_data.get('use_cache'),
            github_token=serializer.validated_data.get('github_token'),
        )
        return Response(payload, status=response_status)

    @action(detail=False, methods=['get'])
    def list_repositories(self, request):
        """
        GET /github-health/list-repositories/

        List all repositories checked by user's organization with their latest scores.
        """
        organization = self._get_user_organization(request)

        repositories = GithubRepository.objects.filter(
            organization=organization
        ).prefetch_related('check_results')

        results = []
        for repo in repositories:
            latest_check = repo.check_results.first()  # Already ordered by -check_timestamp

            results.append({
                "repository": GitHubRepositorySerializer(repo).data,
                "latest_check": CheckResultSummarySerializer(latest_check).data if latest_check else None,
            })

        return Response(results, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def get_check_result(self, request):
        """
        GET /github-health/get-check-result/?result_id=<id>

        Retrieve a specific check result by ID.
        """
        result_id = request.query_params.get('result_id')

        if not result_id:
            return Response(
                {"error": "result_id query parameter is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            organization = self._get_user_organization(request)
            check_result = RepositoryCheckResult.objects.get(
                id=result_id,
                repository__organization=organization
            )
        except RepositoryCheckResult.DoesNotExist:
            return Response(
                {"error": "Check result not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response(
            CheckResultDetailSerializer(check_result).data,
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['get'])
    def repository_history(self, request):
        """
        GET /github-health/repository-history/?url=<url>

        Get all check results for a specific repository, or the full organization history when no URL is provided.
        """
        url = request.query_params.get('url')

        if not url:
            results = RepositoryCheckResult.objects.filter(
                repository__organization=self._get_user_organization(request)
            ).select_related('repository')
            serializer = CheckResultSummarySerializer(results, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        organization = self._get_user_organization(request)
        repository = _match_repository_by_url(url, organization)

        if repository is None:
            return Response([], status=status.HTTP_200_OK)

        results = repository.check_results.all()
        serializer = CheckResultSummarySerializer(results, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['delete'], url_path=r'check-results/(?P<result_id>[^/.]+)')
    def delete_check_result(self, request, result_id=None):
        organization = self._get_user_organization(request)

        try:
            check_result = RepositoryCheckResult.objects.select_related('repository').get(
                id=result_id,
                repository__organization=organization,
            )
        except RepositoryCheckResult.DoesNotExist:
            return Response(
                {"error": "Check result not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        repository = check_result.repository
        check_result.delete()

        latest_result = repository.check_results.first()
        repository.last_check_at = latest_result.check_timestamp if latest_result else None
        repository.save(update_fields=['last_check_at'])

        return Response(status=status.HTTP_204_NO_CONTENT)
