from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta
import re

from .models import GithubRepository, RepositoryCheckResult
from accounts.models import UserSettings
from accounts.services import ensure_user_organization
from .serializers import (
    GitHubRepositorySerializer,
    CheckResultDetailSerializer,
    CheckResultSummarySerializer,
    CheckRepositoryInputSerializer,
)
from .github_health_service import (
    Level1Service,
    Level2Service,
    Level3Service,
    RiskScoringEngine,
)


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

        url = serializer.validated_data['url']
        levels = [int(l) for l in serializer.validated_data.get('levels', ['1', '2', '3'])]

        user_settings, _ = UserSettings.objects.get_or_create(user=request.user)
        use_cache = serializer.validated_data.get('use_cache')
        if use_cache is None:
            use_cache = user_settings.use_cache

        request_token = serializer.validated_data.get('github_token')
        user_token = request_token or user_settings.github_token or None
        cache_duration = user_settings.cache_duration

        # Parse owner and repo from URL
        github_pattern = r'^https://github\.com/([a-zA-Z0-9_-]+)/([a-zA-Z0-9_.-]+)/?$'
        match = re.match(github_pattern, url)

        if not match:
            return Response(
                {"error": "Invalid GitHub URL format"},
                status=status.HTTP_400_BAD_REQUEST
            )

        owner, repo = match.groups()
        organization = self._get_user_organization(request)

        # Get or create repository record
        try:
            github_repo, created = GithubRepository.objects.get_or_create(
                url=url,
                owner=owner,
                name=repo,
                organization=organization
            )
        except GithubRepository.MultipleObjectsReturned:
            github_repo = GithubRepository.objects.filter(url=url, organization=organization).first()

        # Check cache if requested
        if use_cache:
            recent_result = github_repo.check_results.filter(
                check_timestamp__gte=timezone.now() - timedelta(minutes=cache_duration)
            ).first()

            if recent_result:
                return Response(
                    {
                        "message": f"Using cached result (less than {cache_duration} minutes old)",
                        "result": CheckResultDetailSerializer(recent_result).data
                    },
                    status=status.HTTP_200_OK
                )

        # Perform checks
        result_data = _run_checks(owner, repo, levels, user_token)

        if "error" in result_data and "Repository not found" in result_data["error"]:
            return Response(result_data, status=status.HTTP_404_NOT_FOUND)

        if "error" in result_data:
            return Response(result_data, status=status.HTTP_400_BAD_REQUEST)

        # Calculate risk score
        level1_data = result_data.get('level1', {})
        level2_data = result_data.get('level2', {})
        level3_data = result_data.get('level3', {})

        risk_score, score_breakdown = RiskScoringEngine.calculate_score(
            level1_data, level2_data, level3_data
        )

        risk_category = RiskScoringEngine.generate_risk_category(risk_score)
        warnings = RiskScoringEngine.generate_warnings(level1_data, level2_data, level3_data)
        recommendations = RiskScoringEngine.generate_recommendations(level1_data, level2_data, level3_data)

        # Create check result
        check_result = RepositoryCheckResult.objects.create(
            repository=github_repo,
            checked_by=request.user,
            risk_score=risk_score,
            level1_data=level1_data,
            level2_data=level2_data,
            level3_data=level3_data,
            summary=f"{risk_category} - Score: {risk_score}/100",
            warnings=warnings,
            recommendations=recommendations,
        )

        # Update repository last check time
        github_repo.last_check_at = timezone.now()
        github_repo.save(update_fields=['last_check_at'])

        return Response(
            {
                "result": CheckResultDetailSerializer(check_result).data,
                "score_breakdown": score_breakdown,
                "risk_category": risk_category,
            },
            status=status.HTTP_201_CREATED
        )

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

        Get all check results for a specific repository.
        """
        url = request.query_params.get('url')

        if not url:
            return Response(
                {"error": "url query parameter is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        organization = self._get_user_organization(request)

        try:
            repository = GithubRepository.objects.get(
                url=url,
                organization=organization
            )
        except GithubRepository.DoesNotExist:
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