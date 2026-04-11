import { Group, Paper, Progress, SimpleGrid, Stack, Text } from '@mantine/core';
import type { DashboardDistributionDatum, DashboardRiskBandDatum } from '../../utils/dashboard/overview';

type DashboardDistributionPanelProps = {
  assetTypeDistribution: DashboardDistributionDatum[];
  categoryDistribution: DashboardDistributionDatum[];
  riskBandDistribution: DashboardRiskBandDatum[];
  className?: string;
};

export function DashboardDistributionPanel({
  assetTypeDistribution,
  categoryDistribution,
  riskBandDistribution,
  className,
}: DashboardDistributionPanelProps) {
  const totalAssetSurface = assetTypeDistribution.reduce((sum, entry) => sum + entry.value, 0) || 1;
  const totalRiskBands = riskBandDistribution.reduce((sum, entry) => sum + entry.value, 0) || 1;
  const maxAssetValue = Math.max(...assetTypeDistribution.map((entry) => entry.value), 1);
  const maxRiskValue = Math.max(...riskBandDistribution.map((entry) => entry.value), 1);
  const dominantSurface = [...assetTypeDistribution].sort((left, right) => right.value - left.value)[0];
  const dominantRiskBand = [...riskBandDistribution].sort((left, right) => right.value - left.value)[0];
  const categorySections = categoryDistribution.map((entry) => ({
    value: Math.max((entry.value / totalAssetSurface) * 100, 0),
    color: entry.color,
    tooltip: `${entry.label}: ${entry.value}`,
  }));

  return (
    <Paper p="xl" radius="xl" className={`dashboard-panel dashboard-panel-compact ${className ?? ''}`.trim()}>
      <Stack gap="lg">
        <div>
          <Text size="xs" tt="uppercase" fw={800} c="dimmed" style={{ letterSpacing: '0.08em' }}>
            Posture Snapshot
          </Text>
          <Text fw={900} size="xl">
            Current exposure mix and risk concentration
          </Text>
          <Text size="sm" c="dimmed" mt={4}>
            These visuals are live workspace distributions, not historical analytics.
          </Text>
        </div>

        <Group gap="sm">
          <Text size="xs" fw={800} tt="uppercase" c="dimmed" className="app-page-eyebrow">
            {totalAssetSurface} tracked surfaces
          </Text>
          {dominantSurface ? (
            <Text size="xs" fw={800} tt="uppercase" c="dimmed" className="app-page-eyebrow">
              dominant surface: {dominantSurface.label}
            </Text>
          ) : null}
          {dominantRiskBand ? (
            <Text size="xs" fw={800} tt="uppercase" c="dimmed" className="app-page-eyebrow">
              densest risk band: {dominantRiskBand.label}
            </Text>
          ) : null}
        </Group>

        <SimpleGrid cols={{ base: 1, xl: 2 }} spacing="xl">
          <Stack gap="md">
            <Paper p="lg" radius="xl" className="dashboard-panel-soft" withBorder>
              <Stack gap="md">
                <div>
                  <Text fw={800}>Asset surface mix</Text>
                  <Text size="sm" c="dimmed" mt={4}>
                    The workspace is weighted toward these monitored surface types right now.
                  </Text>
                </div>

                <Stack gap="sm">
                  {assetTypeDistribution.map((entry) => {
                    const percentage = totalAssetSurface > 0 ? (entry.value / totalAssetSurface) * 100 : 0;
                    const relativeWidth = maxAssetValue > 0 ? (entry.value / maxAssetValue) * 100 : 0;

                    return (
                      <div key={entry.label} className="dashboard-chart-row">
                        <Group justify="space-between" mb={8} wrap="nowrap">
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
                          <Group gap={10} wrap="nowrap">
                            <Text size="sm" c="dimmed">
                              {Math.round(percentage)}%
                            </Text>
                            <Text fw={800}>{entry.value}</Text>
                          </Group>
                        </Group>

                        <div className="dashboard-chart-track">
                          <div
                            className="dashboard-chart-fill"
                            style={{
                              width: `${Math.max(relativeWidth, entry.value > 0 ? 10 : 0)}%`,
                              background: `linear-gradient(90deg, ${entry.color}, rgba(255,255,255,0.22))`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </Stack>
              </Stack>
            </Paper>

            <SimpleGrid cols={1} spacing="sm">
              {assetTypeDistribution.map((entry) => (
                <Paper key={entry.label} p="sm" radius="lg" className="dashboard-panel-soft" withBorder>
                  <Group justify="space-between" align="center" wrap="nowrap">
                    <Group gap={10} wrap="nowrap">
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 999,
                          background: entry.color,
                          display: 'inline-block',
                        }}
                      />
                      <Text size="sm" fw={700}>
                        {entry.label}
                      </Text>
                    </Group>
                    <Group gap="lg" wrap="nowrap">
                      <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                        {Math.round((entry.value / totalAssetSurface) * 100)}%
                      </Text>
                      <Text fw={900} size="lg">
                        {entry.value}
                      </Text>
                    </Group>
                  </Group>
                  <Text size="xs" c="dimmed" mt={8}>
                    Share of current tracked surface inventory.
                  </Text>
                </Paper>
              ))}
            </SimpleGrid>

          </Stack>

          <Stack gap="md">
            <Paper p="lg" radius="xl" className="dashboard-panel-soft" withBorder>
              <Stack gap="md">
                <div>
                  <Text fw={800}>Risk distribution</Text>
                  <Text size="sm" c="dimmed" mt={4}>
                    Immediate risk pressure is concentrated in these current score bands.
                  </Text>
                </div>

                <Group align="flex-end" grow gap="sm" className="dashboard-risk-columns">
                  {riskBandDistribution.map((entry) => {
                    const percentage = totalRiskBands > 0 ? (entry.value / totalRiskBands) * 100 : 0;
                    const relativeHeight = maxRiskValue > 0 ? (entry.value / maxRiskValue) * 100 : 0;

                    return (
                      <div key={entry.label} className="dashboard-risk-column">
                        <Text size="xs" c="dimmed" fw={700}>
                          {Math.round(percentage)}%
                        </Text>
                        <Text fw={900} size="xl" mt={2}>
                          {entry.value}
                        </Text>
                        <div className="dashboard-risk-bar-shell">
                          <div
                            className="dashboard-risk-bar-fill"
                            style={{
                              height: `${Math.max(relativeHeight, entry.value > 0 ? 14 : 0)}%`,
                              background: `linear-gradient(180deg, rgba(255,255,255,0.2), ${entry.color})`,
                            }}
                          />
                        </div>
                        <Text fw={700} size="sm" mt="sm">
                          {entry.label}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {entry.range}
                        </Text>
                      </div>
                    );
                  })}
                </Group>
              </Stack>
            </Paper>

            {categorySections.length > 0 ? (
              <Paper p="lg" radius="xl" className="dashboard-panel-soft" withBorder>
                <Stack gap="md">
                  <div>
                    <Text fw={800}>Environment balance</Text>
                    <Text size="sm" c="dimmed" mt={4}>
                      Production, development, and test assets are distributed like this right now.
                    </Text>
                  </div>

                  <Progress.Root size={22} radius="xl">
                    {categorySections.map((section) => (
                      <Progress.Section key={section.tooltip} value={section.value} color={section.color}>
                        {section.value >= 16 ? <Progress.Label>{Math.round(section.value)}%</Progress.Label> : null}
                      </Progress.Section>
                    ))}
                  </Progress.Root>

                  <SimpleGrid cols={1} spacing="sm">
                    {categoryDistribution.map((entry) => (
                      <Paper key={entry.label} p="sm" radius="lg" className="dashboard-panel-soft" withBorder>
                        <Group justify="space-between" align="center" wrap="nowrap">
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
                          <Group gap="lg" wrap="nowrap">
                            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                              {Math.round((entry.value / totalAssetSurface) * 100)}%
                            </Text>
                            <Text fw={900} size="lg">
                              {entry.value}
                            </Text>
                          </Group>
                        </Group>
                        <Text size="xs" c="dimmed" mt={8}>
                          Share of current tracked assets in this environment.
                        </Text>
                      </Paper>
                    ))}
                  </SimpleGrid>
                </Stack>
              </Paper>
            ) : null}
          </Stack>
        </SimpleGrid>
      </Stack>
    </Paper>
  );
}
