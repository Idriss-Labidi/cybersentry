import type { Asset, AssetSummaryResponse } from '../../services/assets';
import type { NotificationSummary } from '../../services/notifications';
import type { DashboardFeedItem, DashboardQueueItem } from '../dashboard/overview';
import type {
  AnalyticsDistributionDatum,
  AnalyticsTimelinePoint,
} from './overview';
import type { ReportDefinition, ReportSection } from '../assets/assetScanReport';

type AnalyticsReportInput = {
  generatedAt: string;
  summary: AssetSummaryResponse;
  heroStats: Array<{ label: string; value: string; hint: string }>;
  timeline: AnalyticsTimelinePoint[];
  signalMix: AnalyticsDistributionDatum[];
  signalMixLabel: string;
  riskBands: AnalyticsDistributionDatum[];
  assetTypeMix: AnalyticsDistributionDatum[];
  incidentPriorityMix: AnalyticsDistributionDatum[];
  notificationSummary: NotificationSummary;
  topRiskAssets: Asset[];
  staleAssets: Asset[];
  actionQueue: DashboardQueueItem[];
  activityFeed: DashboardFeedItem[];
};

const createSection = (title: string, value: unknown): ReportSection => ({
  title,
  value,
});

export const createAnalyticsOverviewReport = ({
  generatedAt,
  summary,
  heroStats,
  timeline,
  signalMix,
  signalMixLabel,
  riskBands,
  assetTypeMix,
  incidentPriorityMix,
  notificationSummary,
  topRiskAssets,
  staleAssets,
  actionQueue,
  activityFeed,
}: AnalyticsReportInput): ReportDefinition => ({
  documentTitle: `Analytics snapshot ${generatedAt.slice(0, 19).replaceAll(':', '-')}`,
  reportTitle: 'Analytics Overview Report',
  sections: [
    createSection('Snapshot metadata', {
      generated_at: generatedAt,
      total_assets: summary.total_assets,
      average_risk_score: Math.round(summary.average_risk_score),
      high_risk_assets: summary.high_risk_assets,
      categories: summary.by_category,
      asset_types: summary.by_type,
      notification_summary: notificationSummary,
    }),
    createSection('Executive highlights', heroStats),
    createSection('Signal timeline', timeline),
    createSection(signalMixLabel, signalMix),
    createSection('Risk bands', riskBands),
    createSection('Asset topology', assetTypeMix),
    createSection('Incident priority mix', incidentPriorityMix),
    createSection(
      'Top risk assets',
      topRiskAssets.map((asset) => ({
        id: asset.id,
        name: asset.name,
        value: asset.value,
        type: asset.asset_type_label,
        risk_score: asset.risk_score,
        last_scanned_at: asset.last_scanned_at,
      })),
    ),
    createSection(
      'Coverage gaps',
      staleAssets.map((asset) => ({
        id: asset.id,
        name: asset.name,
        value: asset.value,
        type: asset.asset_type_label,
        last_scanned_at: asset.last_scanned_at,
      })),
    ),
    createSection('Action queue', actionQueue),
    createSection('Live activity', activityFeed),
  ],
});