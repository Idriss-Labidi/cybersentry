import { useMemo, useState, type ReactNode } from 'react';
import { AreaChart } from '@mantine/charts';
import { Badge, Stack, Text } from '@mantine/core';
import { IconChartAreaLine, IconList } from '@tabler/icons-react';
import { DashboardViewModeToggle } from '../dashboard/DashboardViewModeToggle';

type AssetScoreHistoryPoint = {
  id: number | string;
  score: number;
  timestamp: string;
};

type AssetScoreHistoryViewProps = {
  title: string;
  countLabel: string;
  points: AssetScoreHistoryPoint[];
  children: ReactNode;
  chartColor?: string;
  chartSeriesLabel?: string;
};

const integerTickFormatter = (value: number | string) => `${Math.round(Number(value) || 0)}`;

const chartDateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const summaryDateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

function formatChartLabel(timestamp: string, fallbackIndex: number) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return `Entry ${fallbackIndex}`;
  }

  return chartDateFormatter.format(date);
}

function formatSummaryDate(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return 'an unknown date';
  }

  return summaryDateFormatter.format(date);
}

function buildTrendSummary(points: AssetScoreHistoryPoint[]) {
  if (points.length === 0) {
    return 'No saved history is available yet.';
  }

  if (points.length === 1) {
    const point = points[0];
    return `Only one saved result is available: ${point.score}/100 on ${formatSummaryDate(point.timestamp)}.`;
  }

  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  const delta = lastPoint.score - firstPoint.score;
  const changeLabel = delta > 0 ? `+${delta}` : `${delta}`;

  return `Change ${changeLabel} points from ${firstPoint.score}/100 on ${formatSummaryDate(firstPoint.timestamp)} to ${lastPoint.score}/100 on ${formatSummaryDate(lastPoint.timestamp)}.`;
}

export const AssetScoreHistoryView = ({
  title,
  countLabel,
  points,
  children,
  chartColor = 'green',
  chartSeriesLabel = 'Score',
}: AssetScoreHistoryViewProps) => {
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');

  const sortedPoints = useMemo(() => {
    return [...points]
      .map((point, index) => ({
        ...point,
        index,
        time: Number.isNaN(new Date(point.timestamp).getTime()) ? Number.POSITIVE_INFINITY : new Date(point.timestamp).getTime(),
      }))
      .sort((left, right) => {
        if (left.time === right.time) {
          return left.index - right.index;
        }

        return left.time - right.time;
      })
      .map(({ index, ...point }) => point);
  }, [points]);

  const chartData = useMemo(() => {
    return sortedPoints.map((point, index) => ({
      label: formatChartLabel(point.timestamp, index + 1),
      score: point.score,
    }));
  }, [sortedPoints]);

  return (
    <Stack gap="md">
      <DashboardViewModeToggle
        value={viewMode}
        onChange={(value) => setViewMode(value as 'table' | 'chart')}
        label={title}
        options={[
          {
            label: 'Table',
            value: 'table',
            leftSection: <IconList size={14} />,
          },
          {
            label: 'Chart',
            value: 'chart',
            leftSection: <IconChartAreaLine size={14} />,
          },
        ]}
      />

      <Badge variant="light" w="fit-content">
        {countLabel}
      </Badge>

      {viewMode === 'table' ? (
        children
      ) : chartData.length > 0 ? (
        <Stack gap="sm">
          <AreaChart
            h={280}
            data={chartData}
            dataKey="label"
            series={[{ name: 'score', color: chartColor, label: chartSeriesLabel }]}
            withGradient
            withLegend={false}
            withDots
            curveType="natural"
            gridAxis="xy"
            tickLine="none"
            yAxisProps={{ allowDecimals: false, domain: [0, 100], tickFormatter: integerTickFormatter }}
            valueFormatter={(value) => `${value}/100`}
          />

          <Text size="sm" c="dimmed">
            {buildTrendSummary(sortedPoints)}
          </Text>
        </Stack>
      ) : (
        <Text c="dimmed">No saved history is available yet.</Text>
      )}
    </Stack>
  );
};
