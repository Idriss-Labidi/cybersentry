import { Alert, Badge, Button, Center, Container, Group, Loader, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconAlertTriangle, IconChartBar, IconLayoutDashboard, IconRefresh } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { DashboardCommandDeck } from '../../components/dashboard/DashboardCommandDeck';
import { DashboardDistributionPanel } from '../../components/dashboard/DashboardDistributionPanel';
import { DashboardFocusCard } from '../../components/dashboard/DashboardFocusCard';
import { DashboardPulseCard } from '../../components/dashboard/DashboardPulseCard';
import { useDashboardOverview } from '../../hooks/dashboard/useDashboardOverview';

export const Dashboard = () => {
  const {
    summary,
    notificationSummary,
    pulse,
    incidentSnapshot,
    assetTypeDistribution,
    categoryDistribution,
    riskBandDistribution,
    scannedAssetsCount,
    isLoading,
    isRefreshing,
    error,
    lastUpdatedAt,
    refresh,
  } = useDashboardOverview();

  const assetClassCount = assetTypeDistribution.length;
  const uncoveredAssets = Math.max(summary.total_assets - scannedAssetsCount, 0);
  const dominantSurface =
    assetTypeDistribution.reduce((current, entry) => (entry.value > current.value ? entry : current), {
      label: 'No assets',
      value: 0,
      color: '#00e641',
    }).label;

  return (
    <Container size="xl" py="lg" className="app-page">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start" className="dashboard-cockpit-header">
          <Stack gap={6}>
            <Group gap="sm">
              <ThemeIcon size={46} radius="xl" variant="light" color="brand">
                <IconLayoutDashboard size={22} />
              </ThemeIcon>
              <Badge variant="light" color="brand">
                Overview
              </Badge>
            </Group>

            <div>
              <Text component="h1" fw={900} size="1.9rem" style={{ letterSpacing: '-0.04em' }}>
                Security operations cockpit
              </Text>
              <Text size="sm" c="dimmed" mt={4} maw={720}>
                Current posture, current pressure, and where to go next. Use Analytics for deeper trend work.
              </Text>
            </div>
          </Stack>

          <Group gap="xs" className="dashboard-cockpit-actions">
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
              to="/dashboard/analytics"
              variant="light"
              size="sm"
              leftSection={<IconChartBar size={14} />}
            >
              Open analytics
            </Button>
          </Group>
        </Group>

        {error ? (
          <Alert color="yellow" variant="light" radius="sm" icon={<IconAlertTriangle size={16} />}>
            {error}
          </Alert>
        ) : null}

        {isLoading ? (
          <Center py={80}>
            <Stack align="center" gap="sm">
              <Loader size="sm" type="dots" />
              <Text size="sm" c="dimmed">
                Loading workspace overview...
              </Text>
            </Stack>
          </Center>
        ) : (
          <div className="dashboard-page-grid dashboard-cockpit-grid">
            <div className="dashboard-span-7 dashboard-column-stack">
              <DashboardPulseCard
                className="dashboard-top-card"
                pulse={pulse}
                assetClassCount={assetClassCount}
                lastUpdatedAt={lastUpdatedAt}
              />
              <DashboardFocusCard
                criticalIncidents={incidentSnapshot.criticalCount}
                unreadAlerts={notificationSummary.unread}
                uncoveredAssets={uncoveredAssets}
                highRiskAssets={summary.high_risk_assets}
                totalAssets={summary.total_assets}
                productionAssets={summary.by_category.production}
                dominantSurface={dominantSurface}
              />
            </div>

            <DashboardCommandDeck
              className="dashboard-span-5 dashboard-top-card"
              criticalIncidents={incidentSnapshot.criticalCount}
              unreadAlerts={notificationSummary.unread}
              criticalAlerts={notificationSummary.critical}
              uncoveredAssets={uncoveredAssets}
            />

            <DashboardDistributionPanel
              className="dashboard-span-12"
              assetTypeDistribution={assetTypeDistribution}
              categoryDistribution={categoryDistribution}
              riskBandDistribution={riskBandDistribution}
            />
          </div>
        )}
      </Stack>
    </Container>
  );
};
