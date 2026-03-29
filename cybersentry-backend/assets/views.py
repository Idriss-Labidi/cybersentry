from urllib.parse import urlparse

from django.db.models import Avg, Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.services import ensure_user_organization
from dns_tools.models import DNSHealthScan
from dns_tools.serializers import DNSHealthScanSerializer
from dns_tools.services import dns_health_check
from github_health_check.serializers import (
    CheckResultDetailSerializer,
    CheckResultSummarySerializer,
    GitHubRepositorySerializer,
)
from github_health_check.views import normalize_github_repository_url, run_repository_health_check
from ip_tools.models import IPReputationScan
from ip_tools.serializers import IPReputationScanSerializer
from ip_tools.services import check_ip_reputation_with_history
from .models import Asset, AssetAlert, AssetDnsChangeEvent, AssetDnsSnapshot, AssetRiskSnapshot
from .serializers import (
    AssetAlertSerializer,
    AssetDnsChangeEventSerializer,
    AssetDnsSnapshotSerializer,
    AssetLookupSerializer,
    AssetRiskSnapshotSerializer,
    AssetSerializer,
    normalize_asset_value,
)
from .services import apply_asset_signal_score, run_asset_dns_monitor


def _build_default_asset_name(asset_type: str, value: str) -> str:
    if asset_type == Asset.AssetTypes.DOMAIN:
        return f'Domain {value}'

    if asset_type == Asset.AssetTypes.IP:
        return f'IP {value}'

    if asset_type == Asset.AssetTypes.WEBSITE:
        hostname = urlparse(value).netloc or value
        return f'Website {hostname}'

    if asset_type == Asset.AssetTypes.GITHUB_REPOSITORY:
        repo_path = urlparse(value).path.strip('/')
        return f'Repository {repo_path}' if repo_path else 'GitHub repository'

    return value


def _build_creation_defaults(asset_type: str, value: str, risk_score: int = 0):
    normalized_value = normalize_asset_value(asset_type, value)
    return {
        'name': _build_default_asset_name(asset_type, normalized_value),
        'asset_type': asset_type,
        'value': normalized_value,
        'category': Asset.Categories.PRODUCTION,
        'status': Asset.Statuses.ACTIVE,
        'description': '',
        'risk_score': max(0, min(100, int(risk_score))),
        'tag_names': [],
    }


class AssetViewSet(viewsets.ModelViewSet):
    serializer_class = AssetSerializer
    permission_classes = [IsAuthenticated]

    def _get_user_organization(self):
        return ensure_user_organization(self.request.user)

    def get_queryset(self):
        organization = self._get_user_organization()
        queryset = Asset.objects.filter(organization=organization).prefetch_related('tags')

        asset_type = self.request.query_params.get('asset_type')
        category = self.request.query_params.get('category')
        status_value = self.request.query_params.get('status')
        search = self.request.query_params.get('search')

        if asset_type:
            queryset = queryset.filter(asset_type=asset_type)

        if category:
            queryset = queryset.filter(category=category)

        if status_value:
            queryset = queryset.filter(status=status_value)

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(value__icontains=search)
                | Q(description__icontains=search)
                | Q(tags__name__icontains=search)
            ).distinct()

        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        organization = self._get_user_organization()
        asset = serializer.save(organization=organization, created_by=user)
        AssetRiskSnapshot.objects.create(
            asset=asset,
            score=asset.risk_score,
            source='initial',
            note='Initial asset score',
        )

    def perform_update(self, serializer):
        previous_score = serializer.instance.risk_score
        asset = serializer.save()

        if asset.risk_score != previous_score:
            AssetRiskSnapshot.objects.create(
                asset=asset,
                score=asset.risk_score,
                source='manual-update',
                note='Risk score updated from asset form',
            )

    @action(detail=False, methods=['get'])
    def lookup(self, request):
        serializer = AssetLookupSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        asset_type = serializer.validated_data['asset_type']
        value = serializer.validated_data['value']
        risk_score = serializer.validated_data.get('risk_score', 0)
        organization = self._get_user_organization()

        queryset = Asset.objects.filter(
            organization=organization,
            asset_type=asset_type,
        ).prefetch_related('tags')

        if asset_type == Asset.AssetTypes.GITHUB_REPOSITORY:
            github_value = normalize_github_repository_url(value)
            asset = queryset.filter(
                Q(value=github_value) | Q(value=f'{github_value}/')
            ).first()
            lookup_value = github_value
        else:
            asset = queryset.filter(value=value).first()
            lookup_value = value

        return Response(
            {
                'found': asset is not None,
                'asset': AssetSerializer(asset).data if asset else None,
                'lookup': {
                    'asset_type': asset_type,
                    'value': lookup_value,
                },
                'defaults': _build_creation_defaults(asset_type, lookup_value, risk_score),
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['get'])
    def summary(self, request):
        organization = self._get_user_organization()
        queryset = Asset.objects.filter(organization=organization)
        average_risk_score = queryset.aggregate(value=Avg('risk_score'))['value'] or 0

        return Response(
            {
                'total_assets': queryset.count(),
                'high_risk_assets': queryset.filter(risk_score__gte=70).count(),
                'average_risk_score': round(float(average_risk_score), 1),
                'by_category': {
                    'production': queryset.filter(category=Asset.Categories.PRODUCTION).count(),
                    'development': queryset.filter(category=Asset.Categories.DEVELOPMENT).count(),
                    'test': queryset.filter(category=Asset.Categories.TEST).count(),
                },
                'by_type': {
                    'domain': queryset.filter(asset_type=Asset.AssetTypes.DOMAIN).count(),
                    'ip': queryset.filter(asset_type=Asset.AssetTypes.IP).count(),
                    'website': queryset.filter(asset_type=Asset.AssetTypes.WEBSITE).count(),
                    'github_repo': queryset.filter(asset_type=Asset.AssetTypes.GITHUB_REPOSITORY).count(),
                },
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=['get'])
    def related_context(self, request, pk=None):
        asset = self.get_object()

        if asset.asset_type == Asset.AssetTypes.IP:
            history_queryset = IPReputationScan.objects.filter(
                user=request.user,
                ip_address=asset.value,
            )
            latest_scan = history_queryset.first()
            recent_history = history_queryset[:10]

            return Response(
                {
                    'asset_type': asset.asset_type,
                    'message': 'IP reputation history is linked directly to this asset.',
                    'ip_reputation': {
                        'lookup_value': asset.value,
                        'latest_scan': IPReputationScanSerializer(latest_scan).data if latest_scan else None,
                        'history': IPReputationScanSerializer(recent_history, many=True).data,
                    },
                    'github_health': None,
                    'dns_monitor': None,
                },
                status=status.HTTP_200_OK,
            )

        if asset.asset_type == Asset.AssetTypes.GITHUB_REPOSITORY:
            organization = self._get_user_organization()
            normalized_value = normalize_github_repository_url(asset.value)
            repository = organization.github_repositories.filter(
                Q(url=normalized_value) | Q(url=f'{normalized_value}/')
            ).first()
            latest_result = repository.check_results.first() if repository else None
            recent_history = repository.check_results.all()[:10] if repository else []

            return Response(
                {
                    'asset_type': asset.asset_type,
                    'message': 'GitHub health history is linked directly to this asset.',
                    'ip_reputation': None,
                    'github_health': {
                        'lookup_value': normalized_value,
                        'repository': GitHubRepositorySerializer(repository).data if repository else None,
                        'latest_result': CheckResultDetailSerializer(latest_result).data if latest_result else None,
                        'history': CheckResultSummarySerializer(recent_history, many=True).data,
                    },
                    'dns_monitor': None,
                },
                status=status.HTTP_200_OK,
            )

        if asset.asset_type == Asset.AssetTypes.DOMAIN:
            latest_snapshot = asset.dns_snapshots.first()
            recent_snapshots = asset.dns_snapshots.all()[:10]
            recent_changes = asset.dns_change_events.all()[:10]
            recent_alerts = asset.alerts.filter(
                alert_type=AssetAlert.AlertTypes.DNS_CHANGE
            )[:10]
            dns_health_history = DNSHealthScan.objects.filter(
                organization=asset.organization,
                user=request.user,
                domain_name=asset.value,
            )
            latest_health_scan = dns_health_history.first()

            return Response(
                {
                    'asset_type': asset.asset_type,
                    'message': 'DNS monitoring is linked directly to this asset.',
                    'ip_reputation': None,
                    'github_health': None,
                    'dns_monitor': {
                        'lookup_value': asset.value,
                        'latest_snapshot': AssetDnsSnapshotSerializer(latest_snapshot).data if latest_snapshot else None,
                        'snapshots': AssetDnsSnapshotSerializer(recent_snapshots, many=True).data,
                        'recent_changes': AssetDnsChangeEventSerializer(recent_changes, many=True).data,
                        'alerts': AssetAlertSerializer(recent_alerts, many=True).data,
                        'latest_health_check': DNSHealthScanSerializer(latest_health_scan).data if latest_health_scan else None,
                        'health_history': DNSHealthScanSerializer(dns_health_history[:10], many=True).data,
                    },
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {
                'asset_type': asset.asset_type,
                'message': 'Automated related intelligence is not wired yet for this asset type.',
                'ip_reputation': None,
                'github_health': None,
                'dns_monitor': None,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=['post'])
    def run_ip_reputation(self, request, pk=None):
        asset = self.get_object()
        if asset.asset_type != Asset.AssetTypes.IP:
            return Response(
                {'error': 'IP reputation checks are only available for IP assets.'},
                status=status.HTTP_409_CONFLICT,
            )

        result = check_ip_reputation_with_history(asset.value, user=request.user)
        apply_asset_signal_score(
            asset,
            result['score'],
            source='ip-reputation',
            note='Score synced from IP reputation scan',
        )

        return Response({'result': result}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def run_github_health(self, request, pk=None):
        asset = self.get_object()
        if asset.asset_type != Asset.AssetTypes.GITHUB_REPOSITORY:
            return Response(
                {'error': 'GitHub health checks are only available for GitHub repository assets.'},
                status=status.HTTP_409_CONFLICT,
            )

        payload, response_status = run_repository_health_check(
            user=request.user,
            url=asset.value,
            levels=request.data.get('levels', ['1', '2', '3']),
            use_cache=request.data.get('use_cache'),
            github_token=request.data.get('github_token'),
        )

        if response_status in {status.HTTP_200_OK, status.HTTP_201_CREATED}:
            result = payload.get('result')
            if result:
                apply_asset_signal_score(
                    asset,
                    result['risk_score'],
                    source='github-health',
                    note='Score synced from GitHub health check',
                    scanned_at=result.get('check_timestamp'),
                )

        return Response(payload, status=response_status)

    @action(detail=True, methods=['post'])
    def run_dns_monitor(self, request, pk=None):
        asset = self.get_object()
        if asset.asset_type != Asset.AssetTypes.DOMAIN:
            return Response(
                {'error': 'DNS monitoring is only available for domain assets.'},
                status=status.HTTP_409_CONFLICT,
            )

        snapshot, change_events, alert = run_asset_dns_monitor(asset)
        health_result = dns_health_check(asset.value)
        health_scan = DNSHealthScan.objects.create(
            organization=asset.organization,
            user=request.user,
            domain_name=asset.value,
            score=health_result.get('score', 0),
            grade=health_result.get('grade', 'Unknown'),
            checks=health_result.get('checks', {}),
            recommendations=health_result.get('recommendations', []),
        )
        apply_asset_signal_score(
            asset,
            health_scan.score,
            source='dns-health',
            note='Score synced from DNS health check',
            scanned_at=health_scan.scanned_at,
        )

        return Response(
            {
                'snapshot': AssetDnsSnapshotSerializer(snapshot).data,
                'changes': AssetDnsChangeEventSerializer(change_events, many=True).data,
                'alert': AssetAlertSerializer(alert).data if alert else None,
                'health_check': DNSHealthScanSerializer(health_scan).data,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=['get'])
    def dns_snapshots(self, request, pk=None):
        asset = self.get_object()
        if asset.asset_type != Asset.AssetTypes.DOMAIN:
            return Response(
                {'error': 'DNS monitoring snapshots are only available for domain assets.'},
                status=status.HTTP_409_CONFLICT,
            )

        serializer = AssetDnsSnapshotSerializer(asset.dns_snapshots.all()[:30], many=True)
        return Response({'entries': serializer.data}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def dns_changes(self, request, pk=None):
        asset = self.get_object()
        if asset.asset_type != Asset.AssetTypes.DOMAIN:
            return Response(
                {'error': 'DNS monitoring changes are only available for domain assets.'},
                status=status.HTTP_409_CONFLICT,
            )

        serializer = AssetDnsChangeEventSerializer(asset.dns_change_events.all()[:30], many=True)
        return Response({'entries': serializer.data}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def risk_history(self, request, pk=None):
        asset = self.get_object()
        snapshots = asset.risk_snapshots.all()[:30]
        serializer = AssetRiskSnapshotSerializer(snapshots, many=True)
        return Response({'entries': serializer.data}, status=status.HTTP_200_OK)
