import { BarChart, DonutChart } from '@mantine/charts';
import { Group, Paper, Stack, Text } from '@mantine/core';
import type { DashboardDistributionDatum, DashboardRiskBandDatum } from '../../utils/dashboard/overview';

type DashboardDistributionPanelProps = {
  assetTypeDistribution: DashboardDistributionDatum[];
  categoryDistribution: DashboardDistributionDatum[];
  riskBandDistribution: DashboardRiskBandDatum[];
  className?: string;
};

function formatCount(value: number) {
  return `${value} ${value === 1 ? 'asset' : 'assets'}`;
}

export function DashboardDistributionPanel({
  assetTypeDistribution,
  categoryDistribution,
  riskBandDistribution,
  className,
}: DashboardDistributionPanelProps) {
  const sortedSurfaceMix = [...assetTypeDistribution].sort((left, right) => right.value - left.value);
  const totalSurface = sortedSurfaceMix.reduce((sum, entry) => sum + entry.value, 0);
  const totalRisk = riskBandDistribution.reduce((sum, entry) => sum + entry.value, 0);

  const densestRiskBand = [...riskBandDistribution].sort((left, right) => right.value - left.value)[0];

  const riskChartData = riskBandDistribution.map((entry) => ({
    band: entry.label,
    assets: entry.value,
    color: entry.color,
  }));

  return (
    <Paper p="xl" radius="xl" className={`dashboard-panel ${className ?? ''}`.trim()}>
      <Stack gap="lg">
        <div>
          <Text size="xs" tt="uppercase" fw={800} c="dimmed" style={{ letterSpacing: '0.08em' }}>
            Workspace Snapshot
          </Text>
          <Text fw={900} size="xl">
            Surface mix and risk now
          </Text>
          <Text size="sm" c="dimmed" mt={4}>
            A compact read of the workspace. Deeper statistics stay in Analytics.
          </Text>
        </div>

        <div className="dashboard-snapshot-board dashboard-snapshot-board-compact">
          <div className="dashboard-snapshot-surface">
            <Stack gap="md" h="100%">
              <div>
                <Text fw={800}>Asset surface mix</Text>
                <Text size="sm" c="dimmed" mt={4}>
                  What dominates the inventory right now.
                </Text>
              </div>

              <Group justify="center" className="dashboard-chart-shell dashboard-chart-shell-donut">
                {totalSurface > 0 ? (
                  <Stack align="center" gap="sm">
                    <DonutChart
                      data={sortedSurfaceMix.map((entry) => ({
                        name: entry.label,
                        value: entry.value,
                        color: entry.color,
                      }))}
                      size={186}
                      thickness={28}
                      chartLabel={totalSurface}
                      withTooltip
                      tooltipDataSource="segment"
                      valueFormatter={formatCount}
                    />
                    <Text size="xs" c="dimmed">
                      tracked assets
                    </Text>
                  </Stack>
                ) : (
                  <Text size="sm" c="dimmed">
                    No tracked assets yet.
                  </Text>
                )}
              </Group>

              <Group gap="sm" wrap="wrap">
                {sortedSurfaceMix.map((entry) => (
                  <Group key={entry.label} gap={8} wrap="nowrap">
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
                    <Text size="xs" fw={700}>
                      {entry.label}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {entry.value}
                    </Text>
                  </Group>
                ))}
              </Group>

              <Text size="sm" c="dimmed" mt="auto">
                Use this chart to understand where monitoring weight sits across the workspace.
              </Text>
            </Stack>
          </div>

          <div className="dashboard-snapshot-side">
            <Stack gap="md" h="100%">
              <div>
                <Text fw={800}>Risk now</Text>
                <Text size="sm" c="dimmed" mt={4}>
                  Where current score pressure is concentrated.
                </Text>
              </div>

              <div className="dashboard-chart-shell dashboard-chart-shell-risk">
                {totalRisk > 0 ? (
                  <BarChart
                    h={210}
                    data={riskChartData}
                    dataKey="band"
                    series={[{ name: 'assets', color: 'green' }]}
                    orientation="vertical"
                    withLegend={false}
                    withTooltip={false}
                    withBarValueLabel
                    tickLine="none"
                    gridAxis="x"
                    withXAxis={false}
                    xAxisProps={{ type: 'number' }}
                    yAxisProps={{ width: 88 }}
                    valueFormatter={formatCount}
                    getBarColor={(value) => riskBandDistribution.find((entry) => entry.value === value)?.color ?? 'green'}
                    barChartProps={{ margin: { top: 6, right: 18, left: 0, bottom: 6 } }}
                  />
                ) : (
                  <Text size="sm" c="dimmed">
                    No risk data available yet.
                  </Text>
                )}
              </div>

              <Group gap="sm" wrap="wrap">
                {categoryDistribution.map((entry) => (
                  <Paper key={entry.label} p="sm" radius="lg" className="dashboard-panel-soft dashboard-snapshot-chip" withBorder>
                    <Text size="xs" tt="uppercase" fw={700} c="dimmed" style={{ letterSpacing: '0.08em' }}>
                      {entry.label}
                    </Text>
                    <Text mt={6} size="lg" fw={800}>
                      {entry.value}
                    </Text>
                  </Paper>
                ))}
              </Group>

              <Text size="sm" c="dimmed" mt="auto">
                {densestRiskBand
                  ? `${densestRiskBand.label} is the most populated risk band.`
                  : 'No risk concentration detected yet.'}
              </Text>
            </Stack>
          </div>
        </div>
      </Stack>
    </Paper>
  );
}
