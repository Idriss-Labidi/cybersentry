from django.db.models import Q
from django.utils import timezone

from accounts.services import ensure_user_organization
from dns_tools.services import DomainNotFoundError, perform_dns_lookup

from .models import Asset, AssetAlert, AssetDnsChangeEvent, AssetDnsSnapshot, AssetRiskSnapshot
from .serializers import normalize_asset_value

DNS_MONITOR_RECORD_TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SOA']
HIGH_IMPACT_DNS_RECORD_TYPES = {'A', 'AAAA', 'MX', 'NS', 'SOA'}
MEDIUM_IMPACT_DNS_RECORD_TYPES = {'TXT', 'CNAME'}


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


def normalize_dns_records(raw_records: dict, record_types=None):
    normalized = {}
    for record_type in record_types or DNS_MONITOR_RECORD_TYPES:
        values = raw_records.get(record_type, [])
        if isinstance(values, str):
            cleaned_values = []
        else:
            cleaned_values = sorted({str(value).strip() for value in values if str(value).strip()})
        normalized[record_type] = cleaned_values
    return normalized


def _dns_change_severity(record_type: str):
    if record_type == 'STATUS' or record_type in HIGH_IMPACT_DNS_RECORD_TYPES:
        return AssetDnsChangeEvent.Severities.HIGH

    if record_type in MEDIUM_IMPACT_DNS_RECORD_TYPES:
        return AssetDnsChangeEvent.Severities.MEDIUM

    return AssetDnsChangeEvent.Severities.LOW


def _build_dns_change_events(asset: Asset, previous_snapshot: AssetDnsSnapshot, snapshot: AssetDnsSnapshot):
    events = []

    if previous_snapshot.status != snapshot.status:
        events.append(
            AssetDnsChangeEvent(
                asset=asset,
                snapshot=snapshot,
                record_type='STATUS',
                change_type=AssetDnsChangeEvent.ChangeTypes.STATUS,
                severity=AssetDnsChangeEvent.Severities.HIGH,
                summary=f'DNS resolution status changed for {asset.value}',
                previous_value=[previous_snapshot.status],
                current_value=[snapshot.status],
            )
        )

    all_record_types = sorted(
        set(previous_snapshot.records.keys()) | set(snapshot.records.keys()) | set(snapshot.record_types)
    )

    for record_type in all_record_types:
        previous_values = previous_snapshot.records.get(record_type, [])
        current_values = snapshot.records.get(record_type, [])

        if previous_values == current_values:
            continue

        if not previous_values and current_values:
            change_type = AssetDnsChangeEvent.ChangeTypes.ADDED
            summary = f'{record_type} records added for {asset.value}'
        elif previous_values and not current_values:
            change_type = AssetDnsChangeEvent.ChangeTypes.REMOVED
            summary = f'{record_type} records removed for {asset.value}'
        else:
            change_type = AssetDnsChangeEvent.ChangeTypes.MODIFIED
            summary = f'{record_type} records changed for {asset.value}'

        events.append(
            AssetDnsChangeEvent(
                asset=asset,
                snapshot=snapshot,
                record_type=record_type,
                change_type=change_type,
                severity=_dns_change_severity(record_type),
                summary=summary,
                previous_value=previous_values,
                current_value=current_values,
            )
        )

    return events


def _create_dns_change_alert(asset: Asset, change_events):
    if not change_events:
        return None

    severities = {event.severity for event in change_events}
    if AssetDnsChangeEvent.Severities.HIGH in severities:
        severity = AssetAlert.Severities.HIGH
    elif AssetDnsChangeEvent.Severities.MEDIUM in severities:
        severity = AssetAlert.Severities.MEDIUM
    else:
        severity = AssetAlert.Severities.LOW

    impacted_records = sorted({event.record_type for event in change_events})
    title = f'DNS change detected for {asset.value}'
    detail = (
        f'{len(change_events)} DNS change(s) detected. '
        f'Impacted records: {", ".join(impacted_records)}.'
    )

    return AssetAlert.objects.create(
        organization=asset.organization,
        asset=asset,
        alert_type=AssetAlert.AlertTypes.DNS_CHANGE,
        severity=severity,
        title=title,
        detail=detail,
        metadata={
            'record_types': impacted_records,
            'change_summaries': [event.summary for event in change_events],
        },
    )


def run_asset_dns_monitor(asset: Asset):
    if asset.asset_type != Asset.AssetTypes.DOMAIN:
        raise ValueError('DNS monitoring is only available for domain assets.')

    previous_snapshot = asset.dns_snapshots.first()
    status_value = AssetDnsSnapshot.Statuses.SUCCESS
    error_message = ''

    try:
        raw_records = perform_dns_lookup(asset.value, DNS_MONITOR_RECORD_TYPES)
        normalized_records = normalize_dns_records(raw_records, DNS_MONITOR_RECORD_TYPES)
    except DomainNotFoundError:
        status_value = AssetDnsSnapshot.Statuses.FAILED
        error_message = 'The domain does not exist.'
        normalized_records = {record_type: [] for record_type in DNS_MONITOR_RECORD_TYPES}
    except Exception as exc:
        status_value = AssetDnsSnapshot.Statuses.FAILED
        error_message = str(exc)[:255] or 'DNS monitor failed.'
        normalized_records = {record_type: [] for record_type in DNS_MONITOR_RECORD_TYPES}

    snapshot = AssetDnsSnapshot.objects.create(
        asset=asset,
        status=status_value,
        record_types=DNS_MONITOR_RECORD_TYPES,
        records=normalized_records,
        error_message=error_message,
    )

    change_events = []
    alert = None

    if previous_snapshot is not None:
        change_events = _build_dns_change_events(asset, previous_snapshot, snapshot)
        if change_events:
            change_events = AssetDnsChangeEvent.objects.bulk_create(change_events)
            alert = _create_dns_change_alert(asset, change_events)

    asset.last_scanned_at = snapshot.scanned_at or timezone.now()
    asset.save(update_fields=['last_scanned_at', 'updated_at'])

    return snapshot, change_events, alert
