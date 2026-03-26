from django.db.models import Avg, Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.services import ensure_user_organization
from .models import Asset, AssetRiskSnapshot
from .serializers import AssetRiskSnapshotSerializer, AssetSerializer


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
    def risk_history(self, request, pk=None):
        asset = self.get_object()
        snapshots = asset.risk_snapshots.all()[:30]
        serializer = AssetRiskSnapshotSerializer(snapshots, many=True)
        return Response({'entries': serializer.data}, status=status.HTTP_200_OK)
