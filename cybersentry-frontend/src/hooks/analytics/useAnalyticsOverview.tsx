import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAssets, getAssetSummary, type Asset } from '../../services/assets';
import { getIncidents, type IncidentTicket } from '../../services/incidents';
import {
  getNotifications,
  getNotificationSummary,
  type NotificationEvent,
  type NotificationSummary,
} from '../../services/notifications';
import { normalizeNotificationsPayload } from '../../utils/dashboard/overview';
import {
  buildAnalyticsHighlights,
  buildAnalyticsInsights,
  buildAnalyticsTimeline,
  buildAssetTypeMix,
  buildIncidentPriorityMix,
  buildNotificationSeverityMix,
  buildRiskBandDistribution,
} from '../../utils/analytics/overview';
import {
  buildActionQueue,
  buildActivityFeed,
  buildStaleAssets,
  buildTopRiskAssets,
  emptySummary,
} from '../../utils/dashboard/overview';

const emptyNotificationSummary: NotificationSummary = {
  total: 0,
  unread: 0,
  critical: 0,
};

export function useAnalyticsOverview() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [summary, setSummary] = useState(emptySummary);
  const [incidents, setIncidents] = useState<IncidentTicket[]>([]);
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const [notificationSummary, setNotificationSummary] = useState<NotificationSummary>(emptyNotificationSummary);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  const loadData = useCallback(async (silent = false) => {
    if (silent) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    const results = await Promise.allSettled([
      getAssets(),
      getAssetSummary(),
      getIncidents(),
      getNotifications(),
      getNotificationSummary(),
    ]);

    const [assetsResult, summaryResult, incidentsResult, notificationsResult, notificationSummaryResult] = results;
    const failedRequests = results.filter((result) => result.status === 'rejected').length;

    setError(failedRequests > 0 ? 'Some live analytics sources could not be loaded. Showing the latest available snapshot.' : null);

    if (assetsResult.status === 'fulfilled') {
      setAssets(assetsResult.value.data);
    }

    if (summaryResult.status === 'fulfilled') {
      setSummary(summaryResult.value.data);
    }

    if (incidentsResult.status === 'fulfilled') {
      setIncidents(incidentsResult.value.data);
    }

    if (notificationsResult.status === 'fulfilled') {
      setNotifications(normalizeNotificationsPayload(notificationsResult.value.data));
    }

    if (notificationSummaryResult.status === 'fulfilled') {
      setNotificationSummary(notificationSummaryResult.value.data);
    }

    setLastUpdatedAt(new Date().toISOString());
    setIsLoading(false);
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const derived = useMemo(() => {
    const timeline = buildAnalyticsTimeline(assets, incidents, notifications);
    const assetTypeMix = buildAssetTypeMix(summary);
    const riskBands = buildRiskBandDistribution(assets);
    const notificationSeverityMix = buildNotificationSeverityMix(notifications);
    const incidentPriorityMix = buildIncidentPriorityMix(incidents);
    const highlights = buildAnalyticsHighlights(assets, summary, incidents, notifications, notificationSummary.unread);
    const insights = buildAnalyticsInsights(timeline, assetTypeMix, riskBands);
    const topRiskAssets = buildTopRiskAssets(assets);
    const staleAssets = buildStaleAssets(assets);
    const actionQueue = buildActionQueue(incidents, notifications, staleAssets);
    const activityFeed = buildActivityFeed(notifications, incidents);

    return {
      timeline,
      assetTypeMix,
      riskBands,
      notificationSeverityMix,
      incidentPriorityMix,
      highlights,
      insights,
      topRiskAssets,
      staleAssets,
      actionQueue,
      activityFeed,
    };
  }, [assets, incidents, notifications, notificationSummary.unread, summary]);

  return {
    assets,
    summary,
    incidents,
    notifications,
    notificationSummary,
    isLoading,
    isRefreshing,
    error,
    lastUpdatedAt,
    refresh: () => loadData(true),
    ...derived,
  };
}