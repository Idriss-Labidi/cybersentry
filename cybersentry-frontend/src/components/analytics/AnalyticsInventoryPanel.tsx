import { Badge, Group, Paper, SimpleGrid, Text } from '@mantine/core';
import { AreaChart, BarChart, DonutChart } from '@mantine/charts';
import type { Asset, AssetSummaryResponse } from '../../services/assets';
import type { AnalyticsDistributionDatum, AnalyticsTimelinePoint } from '../../utils/analytics/overview';
import { AnalyticsSectionCard } from './AnalyticsSectionCard';
import { AnalyticsCoverageGapsCard } from './AnalyticsCoverageGapsCard';
import { DashboardRankingPanel } from '../dashboard/DashboardRankingPanel';

type AnalyticsInventoryPanelProps = {
  timeline: AnalyticsTimelinePoint[];
  strongestCoverageDay: AnalyticsTimelinePoint | undefined;
  scanCoverage: number;
  riskBands: AnalyticsDistributionDatum[];
  densestRiskBand: AnalyticsDistributionDatum | undefined;
  assetTypeMix: AnalyticsDistributionDatum[];
  summary: AssetSummaryResponse;
  managedAssets: number;
  topRiskAssets: Asset[];
  staleAssets: Asset[];
};

const integerTickFormatter = (value: number | string) => `${Math.round(Number(value) || 0)}`;

export function AnalyticsInventoryPanel({
  timeline,
  strongestCoverageDay,
  scanCoverage,
  riskBands,
  densestRiskBand,
  assetTypeMix,
  summary,
  managedAssets,
  topRiskAssets,
  staleAssets,
}: AnalyticsInventoryPanelProps) {
  const riskChartData = riskBands.map((entry) => ({
    band: entry.label,
    assets: entry.value,
  }));

  const topologyCards = [
    { label: 'Domains', value: summary.by_type.domain, color: '#0f8dcf' },
    { label: 'IPs', value: summary.by_type.ip, color: '#2a5de0' },
    { label: 'Websites', value: summary.by_type.website, color: '#c98600' },
    { label: 'GitHub', value: summary.by_type.github_repo, color: '#d4541f' },
  ];

  return (
    <div className="dashboard-page-grid analytics-page-grid">
      <AnalyticsSectionCard
        className="dashboard-span-7"
        eyebrow="Coverage Cadence"
        title="Onboarding and scan activity"
        description="New assets and latest scans by day, based on current live timestamps."
      >
        <AreaChart
          h={260}
          data={timeline}
          dataKey="label"
          series={[
            { name: 'onboarded', color: 'blue', label: 'Onboarded assets' },
            { name: 'scanned', color: 'green', label: 'Scanned assets' },
          ]}
          withGradient
          withLegend
          curveType="natural"
          withDots={false}
          strokeWidth={3}
          gridAxis="xy"
          tickLine="none"
          yAxisProps={{ allowDecimals: false, tickFormatter: integerTickFormatter }}
          valueFormatter={(value) => `${value} asset${value === 1 ? '' : 's'}`}
        />

        <Group gap="sm" wrap="wrap">
          <Paper p="sm" radius="lg" className="dashboard-panel-soft analytics-inline-stat" withBorder>
            <Text size="xs" tt="uppercase" fw={700} c="dimmed" style={{ letterSpacing: '0.08em' }}>
              Strongest scan day
            </Text>
            <Text mt={6} fw={800}>
              {strongestCoverageDay
                ? `${strongestCoverageDay.label} - ${strongestCoverageDay.scanned} scans`
                : 'No scan activity yet'}
            </Text>
          </Paper>

          <Paper p="sm" radius="lg" className="dashboard-panel-soft analytics-inline-stat" withBorder>
            <Text size="xs" tt="uppercase" fw={700} c="dimmed" style={{ letterSpacing: '0.08em' }}>
              Live coverage
            </Text>
            <Text mt={6} fw={800}>
              {scanCoverage}%
            </Text>
          </Paper>
        </Group>
      </AnalyticsSectionCard>

      <AnalyticsSectionCard
        className="dashboard-span-5"
        eyebrow="Risk Posture"
        title="Current risk band concentration"
        description="How today's inventory is distributed across score bands."
      >
        <BarChart
          h={280}
          data={riskChartData}
          dataKey="band"
          orientation="vertical"
          withLegend={false}
          withBarValueLabel
          tickLine="none"
          gridAxis="x"
          withXAxis={false}
          xAxisProps={{ type: 'number', allowDecimals: false, tickFormatter: integerTickFormatter }}
          yAxisProps={{ width: 92 }}
          series={[{ name: 'assets', color: 'green', label: 'Assets' }]}
          valueFormatter={(value) => `${value} asset${value === 1 ? '' : 's'}`}
          getBarColor={(value) => riskBands.find((entry) => entry.value === value)?.color ?? 'green'}
          barChartProps={{ margin: { top: 6, right: 20, left: 0, bottom: 6 } }}
        />

        <Text size="sm" c="dimmed">
          {densestRiskBand
            ? `${densestRiskBand.label} currently holds the highest asset count.`
            : 'No risk concentration is visible yet.'}
        </Text>
      </AnalyticsSectionCard>

      <div className="dashboard-span-6 dashboard-column-stack">
        <AnalyticsSectionCard
          eyebrow="Inventory Topology"
          title="Current asset mix"
          description="Relative weight of each monitored surface inside the inventory."
          aside={
            <Badge variant="light" color="brand">
              {assetTypeMix.length} surface classes
            </Badge>
          }
        >
          <div className="analytics-topology-layout">
            <div className="analytics-topology-donut">
              {assetTypeMix.length > 0 ? (
                <DonutChart
                  data={assetTypeMix.map((entry) => ({
                    name: entry.label,
                    value: entry.value,
                    color: entry.color,
                  }))}
                  size={220}
                  thickness={30}
                  chartLabel={managedAssets}
                  withTooltip
                  tooltipDataSource="segment"
                  valueFormatter={(value) => `${value} asset${value === 1 ? '' : 's'}`}
                />
              ) : (
                <Text size="sm" c="dimmed">
                  No asset mix available yet.
                </Text>
              )}
            </div>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm" className="analytics-topology-cards">
              {topologyCards.map((entry) => (
                <Paper key={entry.label} p="sm" radius="lg" className="dashboard-panel-soft analytics-topology-card" withBorder>
                  <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <Group gap={10} wrap="nowrap">
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 999,
                          background: entry.color,
                          display: 'inline-block',
                          flex: '0 0 auto',
                        }}
                      />
                      <Text size="sm" fw={700}>
                        {entry.label}
                      </Text>
                    </Group>
                  </Group>
                  <Text size="xs" c="dimmed" mt={6}>
                    {entry.value === 1 ? '1 asset in scope' : `${entry.value} assets in scope`}
                  </Text>
                </Paper>
              ))}
            </SimpleGrid>
          </div>
        </AnalyticsSectionCard>

        <AnalyticsCoverageGapsCard staleAssets={staleAssets} />
      </div>

      <DashboardRankingPanel
        className="dashboard-span-6"
        topRiskAssets={topRiskAssets}
        staleAssets={staleAssets}
        showCoverageGaps={false}
      />
    </div>
  );
}