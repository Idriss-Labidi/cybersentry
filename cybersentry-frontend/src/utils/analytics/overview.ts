import type { Asset, AssetSummaryResponse, AssetType } from '../../services/assets';
import type { IncidentPriority, IncidentStatus, IncidentTicket } from '../../services/incidents';
import type { NotificationEvent, NotificationSeverity } from '../../services/notifications';

export type AnalyticsTimelinePoint = {
  label: string;
  key: string;
  alerts: number;
  incidents: number;
  scanned: number;
  onboarded: number;
};

export type AnalyticsDistributionDatum = {
  label: string;
  value: number;
  color: string;
};

const assetTypeLabels: Record<AssetType, string> = {
  domain: 'Domains',
  ip: 'IPs',
  website: 'Websites',
  github_repo: 'GitHub',
};

const assetTypeColors: Record<AssetType, string> = {
  domain: '#0f8dcf',
  ip: '#2a5de0',
  website: '#c98600',
  github_repo: '#d4541f',
};

const severityColors: Record<NotificationSeverity, string> = {
  low: '#0f8dcf',
  medium: '#c98600',
  high: '#cf3344',
};

const priorityColors: Record<IncidentPriority, string> = {
  low: '#0f8dcf',
  medium: '#5b9a35',
  high: '#c98600',
  critical: '#cf3344',
};

const activeIncidentStatuses: IncidentStatus[] = ['new', 'triaged', 'in_progress', 'on_hold'];

function localDateKey(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildRecentWindow(days = 7) {
  const formatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
  const result: Array<{ key: string; label: string }> = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(now);
    day.setDate(now.getDate() - offset);
    const key = localDateKey(day.toISOString())!;
    result.push({
      key,
      label: formatter.format(day),
    });
  }

  return result;
}

export function buildAnalyticsTimeline(
  assets: Asset[],
  incidents: IncidentTicket[],
  notifications: NotificationEvent[],
  days = 7
): AnalyticsTimelinePoint[] {
  const windowDays = buildRecentWindow(days);

  return windowDays.map((day) => {
    const alerts = notifications.filter((notification) => localDateKey(notification.created_at) === day.key).length;
    const incidentCount = incidents.filter((incident) => localDateKey(incident.reported_at) === day.key).length;
    const scanned = assets.filter((asset) => localDateKey(asset.last_scanned_at) === day.key).length;
    const onboarded = assets.filter((asset) => localDateKey(asset.created_at) === day.key).length;

    return {
      label: day.label,
      key: day.key,
      alerts,
      incidents: incidentCount,
      scanned,
      onboarded,
    };
  });
}

export function buildAssetTypeMix(summary: AssetSummaryResponse): AnalyticsDistributionDatum[] {
  return (Object.entries(summary.by_type) as Array<[AssetType, number]>)
    .map(([type, value]) => ({
      label: assetTypeLabels[type],
      value,
      color: assetTypeColors[type],
    }))
    .filter((entry) => entry.value > 0);
}

export function buildRiskBandDistribution(assets: Asset[]): AnalyticsDistributionDatum[] {
  const bands = [
    { label: 'Stable', color: '#159f4a', matcher: (score: number) => score < 30 },
    { label: 'Watching', color: '#5b9a35', matcher: (score: number) => score >= 30 && score < 50 },
    { label: 'Elevated', color: '#c98600', matcher: (score: number) => score >= 50 && score < 70 },
    { label: 'Critical', color: '#cf3344', matcher: (score: number) => score >= 70 },
  ];

  return bands.map((band) => ({
    label: band.label,
    color: band.color,
    value: assets.filter((asset) => band.matcher(asset.risk_score)).length,
  }));
}

export function buildNotificationSeverityMix(notifications: NotificationEvent[]): AnalyticsDistributionDatum[] {
  return (Object.keys(severityColors) as NotificationSeverity[])
    .map((severity) => ({
      label: severity.charAt(0).toUpperCase() + severity.slice(1),
      value: notifications.filter((notification) => notification.severity === severity).length,
      color: severityColors[severity],
    }))
    .filter((entry) => entry.value > 0);
}

export function buildIncidentPriorityMix(incidents: IncidentTicket[]): AnalyticsDistributionDatum[] {
  return (Object.keys(priorityColors) as IncidentPriority[])
    .map((priority) => ({
      label: priority.charAt(0).toUpperCase() + priority.slice(1),
      value: incidents.filter((incident) => incident.priority === priority).length,
      color: priorityColors[priority],
    }))
    .filter((entry) => entry.value > 0);
}

export function buildAnalyticsHighlights(
  assets: Asset[],
  summary: AssetSummaryResponse,
  incidents: IncidentTicket[],
  notifications: NotificationEvent[],
  unreadAlerts: number
) {
  const activeIncidents = incidents.filter((incident) => activeIncidentStatuses.includes(incident.status));
  const scannedAssets = assets.filter((asset) => !!asset.last_scanned_at).length;
  const scanCoverage = summary.total_assets > 0 ? Math.round((scannedAssets / summary.total_assets) * 100) : 0;

  return {
    managedAssets: summary.total_assets,
    averageRisk: Math.round(summary.average_risk_score),
    activeIncidents: activeIncidents.length,
    unreadAlerts,
    scanCoverage,
    highRiskAssets: summary.high_risk_assets,
    productionAssets: summary.by_category.production,
    liveSignals: notifications.length + activeIncidents.length,
  };
}

export function buildAnalyticsInsights(
  timeline: AnalyticsTimelinePoint[],
  assetTypeMix: AnalyticsDistributionDatum[],
  riskBands: AnalyticsDistributionDatum[]
) {
  const busiestSignalDay = [...timeline].sort(
    (left, right) => right.alerts + right.incidents - (left.alerts + left.incidents)
  )[0];
  const strongestCoverageDay = [...timeline].sort((left, right) => right.scanned - left.scanned)[0];
  const dominantSurface = [...assetTypeMix].sort((left, right) => right.value - left.value)[0];
  const densestRiskBand = [...riskBands].sort((left, right) => right.value - left.value)[0];

  return {
    busiestSignalDay,
    strongestCoverageDay,
    dominantSurface,
    densestRiskBand,
  };
}