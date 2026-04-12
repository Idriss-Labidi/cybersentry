import type { Asset, AssetSummaryResponse, AssetType } from '../../services/assets';
import type {
  IncidentPriority,
  IncidentSeverity,
  IncidentStatus,
  IncidentTicket,
} from '../../services/incidents';
import type {
  NotificationEvent,
  NotificationSeverity,
  NotificationSummary,
  PaginatedNotificationEvents,
} from '../../services/notifications';

export type DashboardTone = 'green' | 'yellow' | 'orange' | 'red' | 'blue' | 'gray';

export type DashboardDistributionDatum = {
  label: string;
  value: number;
  color: string;
};

export type DashboardRiskBandDatum = DashboardDistributionDatum & {
  range: string;
};

export type DashboardSignalDatum = DashboardDistributionDatum & {
  hint: string;
};

export type DashboardQueueItem = {
  id: string;
  kind: 'incident' | 'alert' | 'coverage';
  tone: DashboardTone;
  title: string;
  detail: string;
  meta: string;
  href: string;
  actionLabel: string;
  score: number;
};

export type DashboardFeedItem = {
  id: string;
  tone: DashboardTone;
  title: string;
  detail: string;
  meta: string;
  href: string;
};

export type DashboardPulse = {
  score: number;
  label: string;
  tone: DashboardTone;
  summary: string;
  highlights: Array<{ label: string; value: string; tone?: DashboardTone }>;
};

export const emptySummary: AssetSummaryResponse = {
  total_assets: 0,
  high_risk_assets: 0,
  average_risk_score: 0,
  by_category: {
    production: 0,
    development: 0,
    test: 0,
  },
  by_type: {
    domain: 0,
    ip: 0,
    website: 0,
    github_repo: 0,
  },
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

const categoryColors: Record<keyof AssetSummaryResponse['by_category'], string> = {
  production: '#159f4a',
  development: '#0f8dcf',
  test: '#c98600',
};

const riskBandColors = ['#159f4a', '#5b9a35', '#c98600', '#cf3344'];

const activeIncidentStatuses: IncidentStatus[] = ['new', 'triaged', 'in_progress', 'on_hold'];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function priorityWeight(priority: IncidentPriority) {
  switch (priority) {
    case 'critical':
      return 4;
    case 'high':
      return 3;
    case 'medium':
      return 2;
    default:
      return 1;
  }
}

function incidentSeverityWeight(severity: IncidentSeverity) {
  switch (severity) {
    case 'critical':
      return 5;
    case 'high':
      return 4;
    case 'medium':
      return 3;
    case 'low':
      return 2;
    default:
      return 1;
  }
}

function notificationSeverityWeight(severity: NotificationSeverity) {
  switch (severity) {
    case 'high':
      return 3;
    case 'medium':
      return 2;
    default:
      return 1;
  }
}

export function toneFromNotificationSeverity(severity: NotificationSeverity): DashboardTone {
  if (severity === 'high') {
    return 'red';
  }
  if (severity === 'medium') {
    return 'yellow';
  }
  return 'blue';
}

export function toneFromIncident(incident: IncidentTicket): DashboardTone {
  if (incident.priority === 'critical' || incident.severity === 'critical') {
    return 'red';
  }
  if (incident.priority === 'high' || incident.severity === 'high') {
    return 'orange';
  }
  if (incident.priority === 'medium' || incident.severity === 'medium') {
    return 'yellow';
  }
  return 'blue';
}

export function getAssetRiskTone(score: number): DashboardTone {
  if (score >= 85) {
    return 'red';
  }
  if (score >= 70) {
    return 'orange';
  }
  if (score >= 40) {
    return 'yellow';
  }
  return 'green';
}

export function getAssetTypeLabel(assetType: AssetType) {
  return assetTypeLabels[assetType];
}

export function normalizeNotificationsPayload(
  payload: NotificationEvent[] | PaginatedNotificationEvents | undefined
) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && Array.isArray(payload.results)) {
    return payload.results;
  }

  return [] as NotificationEvent[];
}

export function formatRelativeTime(value: string | null | undefined) {
  if (!value) {
    return 'No timestamp';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'No timestamp';
  }

  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60000);
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes, 'minute');
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, 'hour');
  }

  const diffDays = Math.round(diffHours / 24);
  return formatter.format(diffDays, 'day');
}

export function buildAssetTypeDistribution(summary: AssetSummaryResponse): DashboardDistributionDatum[] {
  return (Object.entries(summary.by_type) as Array<[AssetType, number]>)
    .map(([key, value]) => ({
      label: assetTypeLabels[key],
      value,
      color: assetTypeColors[key],
    }))
    .filter((entry) => entry.value > 0);
}

export function buildCategoryDistribution(summary: AssetSummaryResponse): DashboardDistributionDatum[] {
  return (Object.entries(summary.by_category) as Array<[keyof AssetSummaryResponse['by_category'], number]>)
    .map(([key, value]) => ({
      label: key.charAt(0).toUpperCase() + key.slice(1),
      value,
      color: categoryColors[key],
    }))
    .filter((entry) => entry.value > 0);
}

export function buildRiskBandDistribution(assets: Asset[]): DashboardRiskBandDatum[] {
  const bands = [
    { label: 'Stable', range: '0-29', color: riskBandColors[0], matcher: (score: number) => score < 30 },
    { label: 'Watching', range: '30-49', color: riskBandColors[1], matcher: (score: number) => score >= 30 && score < 50 },
    { label: 'Elevated', range: '50-69', color: riskBandColors[2], matcher: (score: number) => score >= 50 && score < 70 },
    { label: 'Critical', range: '70+', color: riskBandColors[3], matcher: (score: number) => score >= 70 },
  ];

  return bands.map((band) => ({
    label: band.label,
    range: band.range,
    color: band.color,
    value: assets.filter((asset) => band.matcher(asset.risk_score)).length,
  }));
}


export function buildPulse(
  assets: Asset[],
  summary: AssetSummaryResponse,
  incidents: IncidentTicket[],
  notificationSummary: NotificationSummary
): DashboardPulse {
  const totalAssets = Math.max(summary.total_assets, 1);
  const scannedAssets = assets.filter((asset) => !!asset.last_scanned_at).length;
  const unscannedAssets = Math.max(summary.total_assets - scannedAssets, 0);
  const activeIncidents = incidents.filter((incident) => activeIncidentStatuses.includes(incident.status));
  const criticalIncidents = activeIncidents.filter(
    (incident) => incident.priority === 'critical' || incident.severity === 'critical'
  );

  const highRiskPenalty = (summary.high_risk_assets / totalAssets) * 36;
  const coveragePenalty = (unscannedAssets / totalAssets) * 26;
  const incidentPenalty = Math.min(activeIncidents.length * 5 + criticalIncidents.length * 6, 24);
  const alertPenalty = Math.min(notificationSummary.critical * 4 + notificationSummary.unread * 1.5, 20);
  const averageRisk = Math.round(summary.average_risk_score);

  const score = Math.round(clamp(100 - highRiskPenalty - coveragePenalty - incidentPenalty - alertPenalty, 8, 98));

  let label: string;
  let tone: DashboardTone;
  if (score >= 80) {
    label = 'Stable';
    tone = 'green';
  } else if (score >= 60) {
    label = 'Guarded';
    tone = 'yellow';
  } else if (score >= 40) {
    label = 'Pressured';
    tone = 'orange';
  } else {
    label = 'Critical';
    tone = 'red';
  }

  return {
    score,
    label,
    tone,
    summary:
      score >= 80
        ? 'Coverage is holding and immediate pressure is limited.'
        : score >= 60
          ? 'A small cluster of risky assets or unresolved alerts needs attention.'
        : score >= 40
            ? 'Risk and response load are high enough to slow normal handling.'
            : 'Critical risk or unresolved workload is overwhelming normal response.',
    highlights: [
      {
        label: 'Scan coverage',
        value: `${Math.round((scannedAssets / totalAssets) * 100)}%`,
        tone: scannedAssets === summary.total_assets ? 'green' : 'yellow',
      },
      {
        label: 'Average risk',
        value: `${averageRisk}/100`,
        tone: getAssetRiskTone(averageRisk),
      },
      {
        label: 'High-risk assets',
        value: String(summary.high_risk_assets),
        tone: summary.high_risk_assets > 0 ? 'orange' : 'green',
      },
    ],
  };
}

export function buildTopRiskAssets(assets: Asset[], limit = 5) {
  return [...assets]
    .sort((left, right) => {
      if (right.risk_score !== left.risk_score) {
        return right.risk_score - left.risk_score;
      }
      return (new Date(left.last_scanned_at ?? 0).getTime() || 0) - (new Date(right.last_scanned_at ?? 0).getTime() || 0);
    })
    .slice(0, limit);
}

export function buildStaleAssets(assets: Asset[], limit = 5) {
  const staleThreshold = Date.now() - 1000 * 60 * 60 * 24 * 7;
  return [...assets]
    .filter((asset) => !asset.last_scanned_at || new Date(asset.last_scanned_at).getTime() < staleThreshold)
    .sort((left, right) => {
      const leftValue = left.last_scanned_at ? new Date(left.last_scanned_at).getTime() : -Infinity;
      const rightValue = right.last_scanned_at ? new Date(right.last_scanned_at).getTime() : -Infinity;
      return leftValue - rightValue;
    })
    .slice(0, limit);
}

export function buildIncidentSnapshot(incidents: IncidentTicket[]) {
  const active = incidents.filter((incident) => activeIncidentStatuses.includes(incident.status));
  const sorted = [...active].sort((left, right) => {
    const leftWeight = priorityWeight(left.priority) * 2 + incidentSeverityWeight(left.severity);
    const rightWeight = priorityWeight(right.priority) * 2 + incidentSeverityWeight(right.severity);
    if (rightWeight !== leftWeight) {
      return rightWeight - leftWeight;
    }
    return new Date(left.reported_at).getTime() - new Date(right.reported_at).getTime();
  });

  return {
    active,
    top: sorted.slice(0, 5),
    criticalCount: active.filter((incident) => incident.priority === 'critical' || incident.severity === 'critical').length,
    breachedCount: active.filter((incident) => incident.sla_state === 'breached').length,
  };
}

export function buildAlertFeed(notifications: NotificationEvent[]) {
  return [...notifications]
    .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
    .slice(0, 6);
}

export function buildActionQueue(
  incidents: IncidentTicket[],
  notifications: NotificationEvent[],
  staleAssets: Asset[]
): DashboardQueueItem[] {
  const incidentItems: DashboardQueueItem[] = incidents
    .filter((incident) => activeIncidentStatuses.includes(incident.status))
    .slice(0, 4)
    .map((incident) => ({
      id: `incident-${incident.id}`,
      kind: 'incident',
      tone: toneFromIncident(incident),
      title: incident.title,
      detail: `${incident.priority_label} priority incident in ${incident.environment || 'workspace'} environment.`,
      meta: `${incident.status_label} • ${formatRelativeTime(incident.reported_at)}`,
      href: `/dashboard/incidents/${incident.id}`,
      actionLabel: 'Open incident',
      score: priorityWeight(incident.priority) * 20 + incidentSeverityWeight(incident.severity) * 15,
    }));

  const notificationItems: DashboardQueueItem[] = notifications
    .filter((notification) => !notification.is_read)
    .slice(0, 4)
    .map((notification) => ({
      id: `alert-${notification.id}`,
      kind: 'alert',
      tone: toneFromNotificationSeverity(notification.severity),
      title: notification.title,
      detail: notification.detail,
      meta: `${notification.test_type_label} • ${formatRelativeTime(notification.created_at)}`,
      href: notification.asset ? `/dashboard/assets/${notification.asset}` : '/dashboard/alerts',
      actionLabel: notification.asset ? 'Open asset' : 'Open alerts',
      score: notificationSeverityWeight(notification.severity) * 14 + (notification.is_read ? 0 : 6),
    }));

  const staleItems: DashboardQueueItem[] = staleAssets.slice(0, 4).map((asset) => ({
    id: `coverage-${asset.id}`,
    kind: 'coverage',
    tone: asset.last_scanned_at ? 'yellow' : 'orange',
    title: asset.name,
    detail: asset.last_scanned_at
      ? `This asset has not been scanned recently and may be drifting out of visibility.`
      : `This asset has never been scanned from the dashboard intelligence surface.`,
    meta: `${getAssetTypeLabel(asset.asset_type)} • ${asset.last_scanned_at ? formatRelativeTime(asset.last_scanned_at) : 'No scan yet'}`,
    href: `/dashboard/assets/${asset.id}`,
    actionLabel: 'Review asset',
    score: asset.last_scanned_at ? 28 : 34,
  }));

  return [...incidentItems, ...notificationItems, ...staleItems]
    .sort((left, right) => right.score - left.score)
    .slice(0, 6);
}

export function buildActivityFeed(
  notifications: NotificationEvent[],
  incidents: IncidentTicket[]
): DashboardFeedItem[] {
  const notificationItems: DashboardFeedItem[] = notifications.slice(0, 5).map((notification) => ({
    id: `notification-${notification.id}`,
    tone: toneFromNotificationSeverity(notification.severity),
    title: notification.title,
    detail: notification.detail,
    meta: `${notification.test_type_label} • ${formatRelativeTime(notification.created_at)}`,
    href: notification.asset ? `/dashboard/assets/${notification.asset}` : '/dashboard/alerts',
  }));

  const incidentItems: DashboardFeedItem[] = incidents
    .filter((incident) => activeIncidentStatuses.includes(incident.status))
    .slice(0, 4)
    .map((incident) => ({
      id: `incident-feed-${incident.id}`,
      tone: toneFromIncident(incident),
      title: incident.title,
      detail: `${incident.priority_label} priority • ${incident.status_label}`,
      meta: `${incident.short_code || incident.environment || 'Incident'} • ${formatRelativeTime(incident.last_status_change_at)}`,
      href: `/dashboard/incidents/${incident.id}`,
    }));

  return [...notificationItems, ...incidentItems]
    .sort((left, right) => {
      const leftWeight = left.tone === 'red' ? 4 : left.tone === 'orange' ? 3 : left.tone === 'yellow' ? 2 : 1;
      const rightWeight = right.tone === 'red' ? 4 : right.tone === 'orange' ? 3 : right.tone === 'yellow' ? 2 : 1;
      return rightWeight - leftWeight;
    })
    .slice(0, 8);
}
