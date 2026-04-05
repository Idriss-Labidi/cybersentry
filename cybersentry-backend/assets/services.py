from django.db.models import Q
from django.utils import timezone
from datetime import timedelta
import hashlib
import re

import requests

from accounts.models import Organization
from accounts.services import ensure_user_organization
from dns_tools.services import DomainNotFoundError, perform_dns_lookup
from dns_tools.models import DNSHealthScan
from dns_tools.services import dns_health_check
from ip_tools.services import check_ip_reputation_with_history
from notifications.models import NotificationEvent
from notifications.services import dispatch_asset_test_notification

from .models import (
    Asset,
    AssetAlert,
    AssetAutomatedScanRun,
    AssetDnsChangeEvent,
    AssetDnsSnapshot,
    AssetRiskSnapshot,
    AssetWebsiteChangeEvent,
    AssetWebsiteSnapshot,
)
from .serializers import normalize_asset_value

DNS_MONITOR_RECORD_TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SOA']
HIGH_IMPACT_DNS_RECORD_TYPES = {'A', 'AAAA', 'MX', 'NS', 'SOA'}
MEDIUM_IMPACT_DNS_RECORD_TYPES = {'TXT', 'CNAME'}
AUTOMATED_SCAN_INTERVAL_HOURS = 24
WEBSITE_FETCH_TIMEOUT_SECONDS = 10


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


def _website_normalize_content(raw_html: str) -> str:
    without_scripts = re.sub(r'<script[\s\S]*?</script>', '', raw_html, flags=re.IGNORECASE)
    without_styles = re.sub(r'<style[\s\S]*?</style>', '', without_scripts, flags=re.IGNORECASE)
    without_tags = re.sub(r'<[^>]+>', ' ', without_styles)
    return re.sub(r'\s+', ' ', without_tags).strip()


def _website_extract_title(raw_html: str) -> str:
    match = re.search(r'<title[^>]*>(.*?)</title>', raw_html, flags=re.IGNORECASE | re.DOTALL)
    if not match:
        return ''
    return re.sub(r'\s+', ' ', match.group(1)).strip()[:255]


def _create_website_change_alert(asset: Asset, change_events):
    if not change_events:
        return None

    severities = {event.severity for event in change_events}
    if AssetWebsiteChangeEvent.Severities.HIGH in severities:
        severity = AssetAlert.Severities.HIGH
    elif AssetWebsiteChangeEvent.Severities.MEDIUM in severities:
        severity = AssetAlert.Severities.MEDIUM
    else:
        severity = AssetAlert.Severities.LOW

    summaries = [event.summary for event in change_events]
    return AssetAlert.objects.create(
        organization=asset.organization,
        asset=asset,
        alert_type=AssetAlert.AlertTypes.WEBSITE_CONTENT_CHANGE,
        severity=severity,
        title=f'Website content change detected for {asset.value}',
        detail=f'{len(change_events)} website change(s) detected for {asset.value}.',
        metadata={'change_summaries': summaries},
    )


def run_asset_website_monitor(asset: Asset):
    if asset.asset_type != Asset.AssetTypes.WEBSITE:
        raise ValueError('Website monitoring is only available for website assets.')

    previous_snapshot = asset.website_snapshots.first()
    status_value = AssetWebsiteSnapshot.Statuses.SUCCESS
    response_code = None
    content_hash = ''
    page_title = ''
    content_length = 0
    error_message = ''

    try:
        response = requests.get(
            asset.value,
            timeout=WEBSITE_FETCH_TIMEOUT_SECONDS,
            headers={'User-Agent': 'CyberSentry-WebsiteMonitor/1.0'},
        )
        response_code = response.status_code
        if response.status_code >= 400:
            status_value = AssetWebsiteSnapshot.Statuses.FAILED
            error_message = f'HTTP {response.status_code}'
        normalized_content = _website_normalize_content(response.text)
        content_hash = hashlib.sha256(normalized_content.encode('utf-8')).hexdigest() if normalized_content else ''
        page_title = _website_extract_title(response.text)
        content_length = len(normalized_content)
    except Exception as exc:
        status_value = AssetWebsiteSnapshot.Statuses.FAILED
        error_message = str(exc)[:255] or 'Website monitor failed.'

    snapshot = AssetWebsiteSnapshot.objects.create(
        asset=asset,
        status=status_value,
        response_code=response_code,
        content_hash=content_hash,
        page_title=page_title,
        content_length=content_length,
        error_message=error_message,
    )

    events = []
    alert = None

    if previous_snapshot is not None:
        pending_events = []

        if previous_snapshot.status != snapshot.status:
            pending_events.append(
                AssetWebsiteChangeEvent(
                    asset=asset,
                    snapshot=snapshot,
                    change_type=AssetWebsiteChangeEvent.ChangeTypes.STATUS,
                    severity=AssetWebsiteChangeEvent.Severities.HIGH,
                    summary=f'Website status changed for {asset.value}',
                    previous_value={'status': previous_snapshot.status, 'response_code': previous_snapshot.response_code},
                    current_value={'status': snapshot.status, 'response_code': snapshot.response_code},
                )
            )

        if previous_snapshot.content_hash and snapshot.content_hash and previous_snapshot.content_hash != snapshot.content_hash:
            pending_events.append(
                AssetWebsiteChangeEvent(
                    asset=asset,
                    snapshot=snapshot,
                    change_type=AssetWebsiteChangeEvent.ChangeTypes.CONTENT,
                    severity=AssetWebsiteChangeEvent.Severities.HIGH,
                    summary=f'Website content hash changed for {asset.value}',
                    previous_value={'content_hash': previous_snapshot.content_hash, 'content_length': previous_snapshot.content_length},
                    current_value={'content_hash': snapshot.content_hash, 'content_length': snapshot.content_length},
                )
            )

        if previous_snapshot.page_title != snapshot.page_title:
            pending_events.append(
                AssetWebsiteChangeEvent(
                    asset=asset,
                    snapshot=snapshot,
                    change_type=AssetWebsiteChangeEvent.ChangeTypes.TITLE,
                    severity=AssetWebsiteChangeEvent.Severities.MEDIUM,
                    summary=f'Website title changed for {asset.value}',
                    previous_value={'page_title': previous_snapshot.page_title},
                    current_value={'page_title': snapshot.page_title},
                )
            )

        if pending_events:
            events = AssetWebsiteChangeEvent.objects.bulk_create(pending_events)
            alert = _create_website_change_alert(asset, events)

    asset.last_scanned_at = snapshot.scanned_at or timezone.now()
    asset.save(update_fields=['last_scanned_at', 'updated_at'])

    return snapshot, events, alert


def _pick_scan_actor(organization: Organization):
    admin_user = organization.users.filter(role='admin', is_active=True).order_by('id').first()
    if admin_user:
        return admin_user
    return organization.users.filter(is_active=True).order_by('id').first()


def _record_automated_scan_run(*, asset: Asset, scan_type: str, status_value: str, score=None, detail: str = '', metadata=None):
    return AssetAutomatedScanRun.objects.create(
        organization=asset.organization,
        asset=asset,
        scan_type=scan_type,
        status=status_value,
        score=score,
        detail=detail[:255],
        metadata=metadata or {},
    )


def _is_asset_due(asset: Asset, reference_time):
    if asset.last_scanned_at is None:
        return True
    return asset.last_scanned_at <= reference_time - timedelta(hours=AUTOMATED_SCAN_INTERVAL_HOURS)


def _dispatch_change_notification(*, user, asset: Asset, test_type: str, detail: str, metadata=None):
    # Score is set to 0 to guarantee delivery through the existing alert-threshold flow.
    return dispatch_asset_test_notification(
        user=user,
        asset=asset,
        test_type=test_type,
        score=0,
        detail=detail,
        metadata=metadata or {},
    )


def scan_asset_security_health(*, asset: Asset, user):
    if asset.asset_type == Asset.AssetTypes.DOMAIN:
        snapshot, change_events, alert = run_asset_dns_monitor(asset)
        health_result = dns_health_check(asset.value)
        health_scan = DNSHealthScan.objects.create(
            organization=asset.organization,
            user=user,
            domain_name=asset.value,
            score=health_result.get('score', 0),
            grade=health_result.get('grade', 'Unknown'),
            checks=health_result.get('checks', {}),
            recommendations=health_result.get('recommendations', []),
        )
        apply_asset_signal_score(
            asset,
            health_scan.score,
            source='dns-health-automated',
            note='Score synced from automated DNS health check',
            scanned_at=health_scan.scanned_at,
        )

        dispatch_asset_test_notification(
            user=user,
            asset=asset,
            test_type=NotificationEvent.TestTypes.DNS_HEALTH,
            score=health_scan.score,
            detail=f'Automated DNS health check returned {health_scan.score}/100 for {asset.value}.',
            metadata={'grade': health_scan.grade},
        )

        if change_events:
            _dispatch_change_notification(
                user=user,
                asset=asset,
                test_type=NotificationEvent.TestTypes.DNS_CHANGE,
                detail=f'{len(change_events)} DNS change(s) detected for {asset.value}.',
                metadata={'changes': [event.summary for event in change_events]},
            )

        return _record_automated_scan_run(
            asset=asset,
            scan_type=AssetAutomatedScanRun.ScanTypes.DNS,
            status_value=AssetAutomatedScanRun.Statuses.SUCCESS,
            score=health_scan.score,
            detail='Automated DNS scan completed.',
            metadata={
                'snapshot_id': snapshot.id,
                'change_count': len(change_events),
                'alert_id': alert.id if alert else None,
                'grade': health_scan.grade,
            },
        )

    if asset.asset_type == Asset.AssetTypes.IP:
        result = check_ip_reputation_with_history(asset.value, user=user)
        score = max(0, min(100, int(result.get('score', 0))))
        apply_asset_signal_score(
            asset,
            score,
            source='ip-reputation-automated',
            note='Score synced from automated IP reputation scan',
        )

        dispatch_asset_test_notification(
            user=user,
            asset=asset,
            test_type=NotificationEvent.TestTypes.IP_REPUTATION,
            score=score,
            detail=f'Automated IP reputation check returned {score}/100 for {asset.value}.',
            metadata={'risk_level': result.get('risk_level'), 'risk_factors': result.get('risk_factors', [])},
        )

        return _record_automated_scan_run(
            asset=asset,
            scan_type=AssetAutomatedScanRun.ScanTypes.IP,
            status_value=AssetAutomatedScanRun.Statuses.SUCCESS,
            score=score,
            detail='Automated IP reputation scan completed.',
            metadata={'risk_level': result.get('risk_level')},
        )

    if asset.asset_type == Asset.AssetTypes.WEBSITE:
        snapshot, change_events, alert = run_asset_website_monitor(asset)
        score = 90 if snapshot.status == AssetWebsiteSnapshot.Statuses.FAILED else (80 if change_events else 20)
        apply_asset_signal_score(
            asset,
            score,
            source='website-monitor-automated',
            note='Score synced from automated website integrity check',
            scanned_at=snapshot.scanned_at,
        )

        if change_events:
            _dispatch_change_notification(
                user=user,
                asset=asset,
                test_type=NotificationEvent.TestTypes.WEBSITE_CONTENT_CHANGE,
                detail=f'{len(change_events)} website change(s) detected for {asset.value}.',
                metadata={'changes': [event.summary for event in change_events]},
            )

        return _record_automated_scan_run(
            asset=asset,
            scan_type=AssetAutomatedScanRun.ScanTypes.WEBSITE,
            status_value=AssetAutomatedScanRun.Statuses.SUCCESS,
            score=score,
            detail='Automated website integrity scan completed.',
            metadata={
                'snapshot_id': snapshot.id,
                'change_count': len(change_events),
                'alert_id': alert.id if alert else None,
            },
        )

    if asset.asset_type == Asset.AssetTypes.GITHUB_REPOSITORY:
        from github_health_check.views import run_repository_health_check

        payload, response_status = run_repository_health_check(
            user=user,
            url=asset.value,
            levels=['1', '2', '3'],
            use_cache=False,
            github_token=None,
        )

        if response_status not in {200, 201}:
            return _record_automated_scan_run(
                asset=asset,
                scan_type=AssetAutomatedScanRun.ScanTypes.GITHUB,
                status_value=AssetAutomatedScanRun.Statuses.FAILED,
                detail=str(payload.get('error', 'GitHub automated scan failed.')),
                metadata={'response_status': response_status},
            )

        result = payload.get('result', {})
        score = max(0, min(100, int(result.get('risk_score', 0))))
        apply_asset_signal_score(
            asset,
            score,
            source='github-health-automated',
            note='Score synced from automated GitHub health check',
            scanned_at=result.get('check_timestamp'),
        )

        dispatch_asset_test_notification(
            user=user,
            asset=asset,
            test_type=NotificationEvent.TestTypes.GITHUB_HEALTH,
            score=score,
            detail=f'Automated GitHub health check returned {score}/100 for {asset.value}.',
            metadata={'summary': result.get('summary')},
        )

        level3_data = result.get('level3_data', {})
        secret_scanning = level3_data.get('secret_scanning', {}) if isinstance(level3_data, dict) else {}
        secret_count = int(secret_scanning.get('total_secrets_found', 0) or 0)
        has_secrets = bool(secret_scanning.get('has_exposed_secrets'))

        if has_secrets and secret_count > 0:
            AssetAlert.objects.create(
                organization=asset.organization,
                asset=asset,
                alert_type=AssetAlert.AlertTypes.GITHUB_SECRET_EXPOSURE,
                severity=AssetAlert.Severities.HIGH,
                title=f'Secret exposure detected for {asset.value}',
                detail=f'Automated GitHub scan detected {secret_count} exposed secret(s).',
                metadata={'secret_count': secret_count},
            )
            _dispatch_change_notification(
                user=user,
                asset=asset,
                test_type=NotificationEvent.TestTypes.GITHUB_SECRET_EXPOSURE,
                detail=f'Automated GitHub scan detected {secret_count} exposed secret(s) in {asset.value}.',
                metadata={'secret_count': secret_count},
            )

        return _record_automated_scan_run(
            asset=asset,
            scan_type=AssetAutomatedScanRun.ScanTypes.GITHUB,
            status_value=AssetAutomatedScanRun.Statuses.SUCCESS,
            score=score,
            detail='Automated GitHub health scan completed.',
            metadata={
                'check_result_id': result.get('id'),
                'secret_count': secret_count,
            },
        )

    return _record_automated_scan_run(
        asset=asset,
        scan_type=AssetAutomatedScanRun.ScanTypes.WEBSITE,
        status_value=AssetAutomatedScanRun.Statuses.SKIPPED,
        detail=f'No automated scanner configured for asset type {asset.asset_type}.',
    )


def run_organization_automated_health_checks(*, organization: Organization, force: bool = False, now=None):
    reference_time = now or timezone.now()
    actor = _pick_scan_actor(organization)

    if actor is None:
        return {'organization_id': organization.id, 'scanned': 0, 'skipped': 0, 'failed': 0, 'reason': 'No active users available.'}

    assets = Asset.objects.filter(organization=organization).exclude(status=Asset.Statuses.ARCHIVED).order_by('id')
    scanned = 0
    skipped = 0
    failed = 0

    for asset in assets:
        if not force and not _is_asset_due(asset, reference_time):
            skipped += 1
            continue

        try:
            run = scan_asset_security_health(asset=asset, user=actor)
            if run.status == AssetAutomatedScanRun.Statuses.FAILED:
                failed += 1
            else:
                scanned += 1
        except Exception as exc:
            failed += 1
            _record_automated_scan_run(
                asset=asset,
                scan_type={
                    Asset.AssetTypes.DOMAIN: AssetAutomatedScanRun.ScanTypes.DNS,
                    Asset.AssetTypes.IP: AssetAutomatedScanRun.ScanTypes.IP,
                    Asset.AssetTypes.WEBSITE: AssetAutomatedScanRun.ScanTypes.WEBSITE,
                    Asset.AssetTypes.GITHUB_REPOSITORY: AssetAutomatedScanRun.ScanTypes.GITHUB,
                }.get(asset.asset_type, AssetAutomatedScanRun.ScanTypes.WEBSITE),
                status_value=AssetAutomatedScanRun.Statuses.FAILED,
                detail=str(exc),
            )

    return {
        'organization_id': organization.id,
        'organization_name': organization.name,
        'scanned': scanned,
        'skipped': skipped,
        'failed': failed,
    }


def run_all_organizations_automated_health_checks(*, organization_id: int | None = None, force: bool = False, now=None):
    organizations = Organization.objects.filter(id=organization_id) if organization_id else Organization.objects.all().order_by('id')
    return [
        run_organization_automated_health_checks(organization=organization, force=force, now=now)
        for organization in organizations
    ]


