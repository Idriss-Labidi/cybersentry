import { Badge, Group, Paper, Stack, Text } from '@mantine/core';
import { AreaChart, BarChart, DonutChart } from '@mantine/charts';
import type { AnalyticsDistributionDatum, AnalyticsTimelinePoint } from '../../utils/analytics/overview';
import type { NotificationSummary } from '../../services/notifications';
import { formatRelativeTime } from '../../utils/dashboard/overview';
import { AnalyticsSectionCard } from './AnalyticsSectionCard';

type AnalyticsSignalsPanelProps = {
  timeline: AnalyticsTimelinePoint[];
  signalMix: AnalyticsDistributionDatum[];
  signalMixLabel: string;
  incidentPriorityMix: AnalyticsDistributionDatum[];
  notificationSummary: NotificationSummary;
  busiestSignalDay: AnalyticsTimelinePoint | undefined;
  lastUpdatedAt: string | null;
};

const integerTickFormatter = (value: number | string) => `${Math.round(Number(value) || 0)}`;

export function AnalyticsSignalsPanel({
  timeline,
  signalMix,
  signalMixLabel,
  incidentPriorityMix,
  notificationSummary,
  busiestSignalDay,
  lastUpdatedAt,
}: AnalyticsSignalsPanelProps) {
  return (
    <div className="dashboard-page-grid analytics-page-grid">
      <AnalyticsSectionCard
        className="dashboard-span-8"
        eyebrow="Signal Velocity"
        title="Alerts and incidents over the last 7 days"
        description="Live volume by day. This shows how quickly operator pressure is accumulating."
        aside={
          <Badge variant="light" color="brand">
            Last 7 days
          </Badge>
        }
      >
        <AreaChart
          h={280}
          data={timeline}
          dataKey="label"
          series={[
            { name: 'alerts', color: 'yellow', label: 'Alerts' },
            { name: 'incidents', color: 'red', label: 'Incidents' },
          ]}
          withGradient
          withLegend
          curveType="natural"
          withDots={false}
          strokeWidth={3}
          gridAxis="xy"
          tickLine="none"
          yAxisProps={{ allowDecimals: false, tickFormatter: integerTickFormatter }}
          valueFormatter={(value) => `${value} signal${value === 1 ? '' : 's'}`}
        />

        <Group gap="sm" wrap="wrap">
          <Paper p="sm" radius="lg" className="dashboard-panel-soft analytics-inline-stat" withBorder>
            <Text size="xs" tt="uppercase" fw={700} c="dimmed" style={{ letterSpacing: '0.08em' }}>
              Busiest signal day
            </Text>
            <Text mt={6} fw={800}>
              {busiestSignalDay
                ? `${busiestSignalDay.label} - ${busiestSignalDay.alerts + busiestSignalDay.incidents} signals`
                : 'No recent signal day'}
            </Text>
          </Paper>

          <Paper p="sm" radius="lg" className="dashboard-panel-soft analytics-inline-stat" withBorder>
            <Text size="xs" tt="uppercase" fw={700} c="dimmed" style={{ letterSpacing: '0.08em' }}>
              Live refresh
            </Text>
            <Text mt={6} fw={800}>
              {formatRelativeTime(lastUpdatedAt)}
            </Text>
          </Paper>
        </Group>
      </AnalyticsSectionCard>

      <AnalyticsSectionCard
        className="dashboard-span-4"
        eyebrow="Signal Mix"
        title={signalMixLabel}
        description="Live severity and pressure composition across the current signal stream."
      >
        <Stack gap="md" align="center">
          {signalMix.length > 0 ? (
            <DonutChart
              data={signalMix.map((entry) => ({
                name: entry.label,
                value: entry.value,
                color: entry.color,
              }))}
              size={220}
              thickness={32}
              chartLabel={signalMix.reduce((sum, entry) => sum + entry.value, 0)}
              withTooltip
              tooltipDataSource="segment"
              valueFormatter={(value) => `${value} item${value === 1 ? '' : 's'}`}
            />
          ) : (
            <Text size="sm" c="dimmed">
              No live alert or incident mix available yet.
            </Text>
          )}

          <Stack gap="xs" w="100%">
            {signalMix.map((entry) => (
              <Paper key={entry.label} p="sm" radius="lg" className="dashboard-panel-soft analytics-legend-row" withBorder>
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
                  <Text fw={800}>{entry.value}</Text>
                </Group>
              </Paper>
            ))}
          </Stack>
        </Stack>
      </AnalyticsSectionCard>

      <AnalyticsSectionCard
        className="dashboard-span-12"
        eyebrow="Response Mix"
        title="Incident priority profile"
        description="Priority pressure across the current incident set."
      >
        <BarChart
          h={250}
          data={incidentPriorityMix.map((entry) => ({
            priority: entry.label,
            tickets: entry.value,
          }))}
          dataKey="priority"
          series={[{ name: 'tickets', color: 'red', label: 'Incidents' }]}
          withLegend={false}
          withBarValueLabel
          tickLine="none"
          gridAxis="y"
          yAxisProps={{ allowDecimals: false, tickFormatter: integerTickFormatter }}
          valueFormatter={(value) => `${value} incident${value === 1 ? '' : 's'}`}
          getBarColor={(value) => incidentPriorityMix.find((entry) => entry.value === value)?.color ?? 'red'}
          barChartProps={{ margin: { top: 8, right: 8, left: -8, bottom: 0 } }}
        />

        <Group gap="sm" wrap="wrap">
          <Paper p="sm" radius="lg" className="dashboard-panel-soft analytics-inline-stat" withBorder>
            <Text size="xs" tt="uppercase" fw={700} c="dimmed" style={{ letterSpacing: '0.08em' }}>
              Live unread alerts
            </Text>
            <Text mt={6} fw={800}>
              {notificationSummary.unread}
            </Text>
          </Paper>

          <Paper p="sm" radius="lg" className="dashboard-panel-soft analytics-inline-stat" withBorder>
            <Text size="xs" tt="uppercase" fw={700} c="dimmed" style={{ letterSpacing: '0.08em' }}>
              Critical alerts
            </Text>
            <Text mt={6} fw={800}>
              {notificationSummary.critical}
            </Text>
          </Paper>
        </Group>
      </AnalyticsSectionCard>
    </div>
  );
}