import { DashboardActivityFeed } from '../dashboard/DashboardActivityFeed';
import { DashboardQueuePanel } from '../dashboard/DashboardQueuePanel';
import type { DashboardFeedItem, DashboardQueueItem } from '../../utils/dashboard/overview';

type AnalyticsOperationsPanelProps = {
  actionQueue: DashboardQueueItem[];
  activityFeed: DashboardFeedItem[];
  unreadAlerts: number;
  criticalAlerts: number;
  activeIncidents: number;
};

export function AnalyticsOperationsPanel({
  actionQueue,
  activityFeed,
  unreadAlerts,
  criticalAlerts,
  activeIncidents,
}: AnalyticsOperationsPanelProps) {
  return (
    <div className="dashboard-page-grid analytics-page-grid">
      <DashboardQueuePanel className="dashboard-span-6" items={actionQueue} />
      <DashboardActivityFeed
        className="dashboard-span-6"
        items={activityFeed}
        unreadAlerts={unreadAlerts}
        criticalAlerts={criticalAlerts}
        activeIncidents={activeIncidents}
      />
    </div>
  );
}