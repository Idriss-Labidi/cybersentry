import { Alert, Button, Center, Group, Loader, Stack, Tabs, Text } from '@mantine/core';
import { useMemo } from 'react';
import { IconAlertTriangle, IconAnalyze, IconChartAreaLine, IconRefresh, IconShieldHalfFilled, IconWaveSawTool } from '@tabler/icons-react';
import { AnalyticsInventoryPanel } from '../../components/analytics/AnalyticsInventoryPanel';
import { AnalyticsOperationsPanel } from '../../components/analytics/AnalyticsOperationsPanel';
import { AnalyticsSignalsPanel } from '../../components/analytics/AnalyticsSignalsPanel';
import { ReportActionButtons } from '../../components/reports/ReportActionButtons';
import { useAnalyticsOverview } from '../../hooks/analytics/useAnalyticsOverview';
import DashboardPageLayout, { DashboardStatCards } from '../../layouts/dashboard/DashboardPageLayout';
import { createAnalyticsOverviewReport } from '../../utils/analytics/report';
import { downloadReport, type ReportExportFormat } from '../../utils/assets/assetScanExport';
import { printReport } from '../../utils/assets/assetScanPrint';
import { notifyError } from '../../utils/ui-notify';

export const Analytics = () => {
  const {
    summary,
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
    notificationSummary,
    isLoading,
    isRefreshing,
    error,
    lastUpdatedAt,
    refresh,
  } = useAnalyticsOverview();

  const heroStats = useMemo(
    () => [
      {
        label: 'Managed assets',
        value: String(highlights.managedAssets),
        hint: `${highlights.productionAssets} production assets in scope`,
      },
      {
        label: 'Scan coverage',
        value: `${highlights.scanCoverage}%`,
        hint: `${highlights.highRiskAssets} high-risk assets in current inventory`,
      },
      {
        label: 'Active incidents',
        value: String(highlights.activeIncidents),
        hint: `${notificationSummary.critical} critical alert${notificationSummary.critical === 1 ? '' : 's'} live now`,
      },
      {
        label: 'Average risk',
        value: `${highlights.averageRisk}/100`,
        hint: `${highlights.liveSignals} live signals across incidents and notifications`,
      },
    ],
    [
      highlights.activeIncidents,
      highlights.averageRisk,
      highlights.highRiskAssets,
      highlights.liveSignals,
      highlights.managedAssets,
      highlights.productionAssets,
      highlights.scanCoverage,
      notificationSummary.critical,
    ],
  );

  const signalMix = notificationSeverityMix.length > 0 ? notificationSeverityMix : incidentPriorityMix;
  const signalMixLabel = notificationSeverityMix.length > 0 ? 'Alert severity mix' : 'Incident priority mix';
  const analyticsReport = useMemo(
    () =>
      createAnalyticsOverviewReport({
        generatedAt: lastUpdatedAt ?? new Date().toISOString(),
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
      }),
    [
      actionQueue,
      activityFeed,
      assetTypeMix,
      heroStats,
      incidentPriorityMix,
      lastUpdatedAt,
      notificationSummary,
      riskBands,
      signalMix,
      signalMixLabel,
      staleAssets,
      summary,
      timeline,
      topRiskAssets,
    ],
  );

  const handlePrint = () => {
    try {
      printReport(analyticsReport);
    } catch (error) {
      notifyError(
        'Print failed',
        error instanceof Error ? error.message : 'The analytics print preview could not be opened.',
      );
    }
  };

  const handleExport = (format: ReportExportFormat) => {
    try {
      downloadReport(analyticsReport, format);
    } catch (error) {
      notifyError(
        'Export failed',
        error instanceof Error ? error.message : 'The analytics report could not be exported.',
      );
    }
  };

  return (
    <DashboardPageLayout
      icon={<IconAnalyze size={26} />}
      eyebrow="Analytics"
      title="Trends, posture, and reporting"
      description="Live analytical views across exposure, signal volume, coverage cadence, and response load. This page goes deeper than the dashboard cockpit."
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
          <ReportActionButtons
            onPrint={handlePrint}
            onExport={handleExport}
            loading={isRefreshing}
            printTitle="Print analytics report"
          />
        </Group>
      }
    >
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
              Loading analytics workspace...
            </Text>
          </Stack>
        </Center>
      ) : (
        <Stack gap="lg">
          <DashboardStatCards items={heroStats} />

          <Tabs
            defaultValue="signals"
            variant="outline"
            radius="lg"
            classNames={{ list: 'analytics-tabs-list', panel: 'analytics-tab-panel' }}
          >
            <Tabs.List>
              <Tabs.Tab value="signals" leftSection={<IconChartAreaLine size={15} />}>
                Signals
              </Tabs.Tab>
              <Tabs.Tab value="inventory" leftSection={<IconShieldHalfFilled size={15} />}>
                Inventory
              </Tabs.Tab>
              <Tabs.Tab value="operations" leftSection={<IconWaveSawTool size={15} />}>
                Operations
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="signals" pt="lg">
              <AnalyticsSignalsPanel
                timeline={timeline}
                signalMix={signalMix}
                signalMixLabel={signalMixLabel}
                incidentPriorityMix={incidentPriorityMix}
                notificationSummary={notificationSummary}
                busiestSignalDay={insights.busiestSignalDay}
                lastUpdatedAt={lastUpdatedAt}
              />
            </Tabs.Panel>

            <Tabs.Panel value="inventory" pt="lg">
              <AnalyticsInventoryPanel
                timeline={timeline}
                strongestCoverageDay={insights.strongestCoverageDay}
                scanCoverage={highlights.scanCoverage}
                riskBands={riskBands}
                densestRiskBand={insights.densestRiskBand}
                assetTypeMix={assetTypeMix}
                summary={summary}
                managedAssets={highlights.managedAssets}
                topRiskAssets={topRiskAssets}
                staleAssets={staleAssets}
              />
            </Tabs.Panel>

            <Tabs.Panel value="operations" pt="lg">
              <AnalyticsOperationsPanel
                actionQueue={actionQueue}
                activityFeed={activityFeed}
                unreadAlerts={notificationSummary.unread}
                criticalAlerts={notificationSummary.critical}
                activeIncidents={highlights.activeIncidents}
              />
            </Tabs.Panel>
          </Tabs>
        </Stack>
      )}
    </DashboardPageLayout>
  );
};