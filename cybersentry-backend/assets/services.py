from django.db.models import Q
from django.utils import timezone

from accounts.services import ensure_user_organization

from .models import Asset, AssetRiskSnapshot
from .serializers import normalize_asset_value


def apply_asset_signal_score(asset: Asset, score: int, *, source: str, note: str, scanned_at=None):
    normalized_score = max(0, min(100, int(score)))
    previous_score = asset.risk_score

    asset.risk_score = normalized_score
    asset.last_scanned_at = scanned_at or timezone.now()
    asset.save(update_fields=['risk_score', 'last_scanned_at', 'updated_at'])

    if previous_score != normalized_score:
        AssetRiskSnapshot.objects.create(
            asset=asset,
            score=normalized_score,
            source=source,
            note=note,
        )

    return asset


def sync_linked_asset_score(user, *, asset_type: str, value: str, score: int, source: str, note: str, scanned_at=None):
    organization = ensure_user_organization(user)
    normalized_value = normalize_asset_value(asset_type, value)
    queryset = Asset.objects.filter(
        organization=organization,
        asset_type=asset_type,
    )

    if asset_type == Asset.AssetTypes.GITHUB_REPOSITORY:
        asset = queryset.filter(
            Q(value=normalized_value) | Q(value=f'{normalized_value}/')
        ).first()
    else:
        asset = queryset.filter(value=normalized_value).first()

    if asset is None:
        return None

    return apply_asset_signal_score(
        asset,
        score,
        source=source,
        note=note,
        scanned_at=scanned_at,
    )
