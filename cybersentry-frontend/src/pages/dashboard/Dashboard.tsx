import { Alert, Button, Center, Group, Loader, Stack, Text } from '@mantine/core';
import { IconAlertTriangle, IconArrowRight, IconLayoutDashboard, IconRefresh } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { DashboardActivityFeed } from '../../components/dashboard/DashboardActivityFeed';
import { DashboardCommandDeck } from '../../components/dashboard/DashboardCommandDeck';
import { DashboardDistributionPanel } from '../../components/dashboard/DashboardDistributionPanel';
import { DashboardPulseCard } from '../../components/dashboard/DashboardPulseCard';
import { DashboardQueuePanel } from '../../components/dashboard/DashboardQueuePanel';
import { DashboardRankingPanel } from '../../components/dashboard/DashboardRankingPanel';
import type { GuidanceItem } from '../../components/guidance/GuidanceHoverCard';
import { useDashboardOverview } from '../../hooks/dashboard/useDashboardOverview';
import DashboardPageLayout from '../../layouts/dashboard/DashboardPageLayout';

export const Dashboard = () => {
  const {
    summary,
    notificationSummary,
    pulse,
    incidentSnapshot,
    assetTypeDistribution,
    categoryDistribution,
    riskBandDistribution,
    topRiskAssets,
    staleAssets,
    actionQueue,
    activityFeed,
    scannedAssetsCount,
    isLoading,
    isRefreshing,
    error,
    lastUpdatedAt,
    refresh,
  } = useDashboardOverview();

  const mostExposedSurface =
    assetTypeDistribution.reduce((current, entry) => (entry.value > current.value ? entry : current), {
      label: 'No assets',
      value: 0,
      color: '#00e641',
    }).label;

  const uncoveredAssets = Math.max(summary.total_assets - scannedAssetsCount, 0);

  const heroMetrics = [
    {
      label: 'Security pulse',
      value: `${pulse.score}/100`,
      hint: `Current workspace stance: ${pulse.label}`,
      tone: pulse.tone === 'red' ? 'red' : pulse.tone === 'orange' ? 'orange' : pulse.tone === 'yellow' ? 'yellow' : 'green',
    },
    {
      label: 'Managed assets',
      value: String(summary.total_assets),
      hint: `${summary.by_type.domain + summary.by_type.website} external surfaces currently tracked`,
    },
    {
      label: 'Active incidents',
      value: String(incidentSnapshot.active.length),
      hint: `${incidentSnapshot.criticalCount} critical and ${incidentSnapshot.breachedCount} breached SLA`,
      tone: incidentSnapshot.criticalCount > 0 ? 'red' : incidentSnapshot.active.length > 0 ? 'yellow' : 'green',
    },
    {
      label: 'Unread alerts',
      value: String(notificationSummary.unread),
      hint: `${notificationSummary.critical} critical alerts in the queue`,
      tone: notificationSummary.critical > 0 ? 'red' : notificationSummary.unread > 0 ? 'yellow' : 'green',
    },
  ];

  const guidanceItems: GuidanceItem[] = [
    {
      label: 'What this page is for',
      title: 'Operations cockpit',
      description:
        'This dashboard is a current-state command surface. It tells operators what matters now and where to go next.',
      bullets: [
        'Use the pulse, queue, and rankings to decide what to open first.',
        'Use Analytics for long-term trends and reporting, not this page.',
      ],
      badge: 'Dashboard',
    },
    {
      label: 'How to read it',
      title: 'Prioritize by pressure',
      description:
        'The dashboard intentionally blends posture, incidents, alerts, and coverage gaps so the next action is obvious.',
      bullets: [
        'Red and orange elements indicate immediate operational pressure.',
        'Coverage gaps highlight assets that risk falling out of visibility.',
      ],
    },
  ];

  return (
    <DashboardPageLayout
      icon={<IconLayoutDashboard size={26} />}
      eyebrow="Overview"
      title="Security operations cockpit"
      description="A live snapshot of asset exposure, alert pressure, incident load, and operator priorities across the workspace."
      metrics={heroMetrics}
      guidance={guidanceItems}
      actions={
        <Group gap="xs">
          <Button
            variant="subtle"
            color="gray"
            size="sm"
            onClick={() => void refresh()}
            loading={isRefreshing}
            leftSection={<IconRefresh size={14} />}
          >
            Refresh
          </Button>
          <Button
            component={Link}
            to="/dashboard/assets"
            size="sm"
            rightSection={<IconArrowRight size={14} />}
          >
            Open assets
          </Button>
        </Group>
      }
    >
      {error ? (
        <Alert
          color="yellow"
          variant="light"
          radius="sm"
          icon={<IconAlertTriangle size={16} />}
          mb="md"
        >
          {error}
        </Alert>
      ) : null}

      {isLoading ? (
        <Center py={80}>
          <Stack align="center" gap="sm">
            <Loader size="sm" type="dots" />
            <Text size="sm" c="dimmed">Loading workspace overview...</Text>
          </Stack>
        </Center>
      ) : (
        <div className="dashboard-page-grid">
          <DashboardPulseCard
            className="dashboard-span-6"
            pulse={pulse}
            totalAssets={summary.total_assets}
            mostExposedSurface={mostExposedSurface}
            lastUpdatedAt={lastUpdatedAt}
          />

          <DashboardCommandDeck
            className="dashboard-span-6"
            criticalIncidents={incidentSnapshot.criticalCount}
            breachedIncidents={incidentSnapshot.breachedCount}
            unreadAlerts={notificationSummary.unread}
            criticalAlerts={notificationSummary.critical}
            uncoveredAssets={uncoveredAssets}
            mostExposedSurface={mostExposedSurface}
          />

          <DashboardDistributionPanel
            className="dashboard-span-7"
            assetTypeDistribution={assetTypeDistribution}
            categoryDistribution={categoryDistribution}
            riskBandDistribution={riskBandDistribution}
          />

          <DashboardRankingPanel
            className="dashboard-span-5"
            topRiskAssets={topRiskAssets}
            staleAssets={staleAssets}
          />

          <DashboardQueuePanel className="dashboard-span-6" items={actionQueue} />

          <DashboardActivityFeed
            className="dashboard-span-6"
            items={activityFeed}
            unreadAlerts={notificationSummary.unread}
            criticalAlerts={notificationSummary.critical}
            activeIncidents={incidentSnapshot.active.length}
          />
        </div>
      )}
    </DashboardPageLayout>
  );
};
