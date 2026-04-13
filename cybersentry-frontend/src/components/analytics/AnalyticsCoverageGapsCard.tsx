import { Button, Group, Paper, Stack, Text } from '@mantine/core';
import { IconClockHour4 } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import type { Asset } from '../../services/assets';
import { formatRelativeTime } from '../../utils/dashboard/overview';

type AnalyticsCoverageGapsCardProps = {
  staleAssets: Asset[];
  className?: string;
};

export function AnalyticsCoverageGapsCard({
  staleAssets,
  className,
}: AnalyticsCoverageGapsCardProps) {
  return (
    <Paper
      p="xl"
      radius="xl"
      className={`dashboard-panel analytics-section-card ${className ?? ''}`.trim()}
    >
      <Stack gap="lg">
        <div>
          <Text size="xs" tt="uppercase" fw={800} c="dimmed" style={{ letterSpacing: '0.08em' }}>
            Coverage Gaps
          </Text>
          <Text fw={900} size="xl">
            Assets drifting out of visibility
          </Text>
          <Text size="sm" c="dimmed" mt={4}>
            Use this list to bring stale or never-scanned assets back into monitoring.
          </Text>
        </div>

        <Group gap="sm">
          <IconClockHour4 size={16} />
          <Text fw={800}>{staleAssets.length} asset{staleAssets.length === 1 ? '' : 's'} currently stale</Text>
        </Group>

        <Stack gap="xs">
          {staleAssets.length > 0 ? (
            staleAssets.map((asset) => (
              <Group key={asset.id} justify="space-between" className="dashboard-inline-row">
                <div>
                  <Text fw={700}>{asset.name}</Text>
                  <Text size="sm" c="dimmed">
                    {asset.last_scanned_at ? `Last signal ${formatRelativeTime(asset.last_scanned_at)}` : 'No scan recorded yet'}
                  </Text>
                </div>
                <Button component={Link} to={`/dashboard/assets/${asset.id}`} size="compact-sm" variant="subtle">
                  Review
                </Button>
              </Group>
            ))
          ) : (
            <Text size="sm" c="dimmed">
              All tracked assets have recent visibility.
            </Text>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}