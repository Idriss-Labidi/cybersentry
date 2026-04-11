import { Badge, Button, Group, Paper, Stack, Text } from '@mantine/core';
import { IconArrowUpRight, IconClockHour4 } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import type { Asset } from '../../services/assets';
import { formatRelativeTime, getAssetRiskTone, getAssetTypeLabel } from '../../utils/dashboard/overview';

type DashboardRankingPanelProps = {
  topRiskAssets: Asset[];
  staleAssets: Asset[];
  className?: string;
};

function toneColor(tone: ReturnType<typeof getAssetRiskTone>) {
  switch (tone) {
    case 'red':
      return 'red';
    case 'orange':
      return 'orange';
    case 'yellow':
      return 'yellow';
    default:
      return 'green';
  }
}

export function DashboardRankingPanel({
  topRiskAssets,
  staleAssets,
  className,
}: DashboardRankingPanelProps) {
  return (
    <Paper p="xl" radius="xl" className={`dashboard-panel ${className ?? ''}`.trim()}>
      <Stack gap="lg">
        <div>
          <Text size="xs" tt="uppercase" fw={800} c="dimmed" style={{ letterSpacing: '0.08em' }}>
            Priority Assets
          </Text>
          <Text fw={900} size="xl">
            Risk ranking and visibility gaps
          </Text>
        </div>

        <Stack gap="sm">
          {topRiskAssets.length > 0 ? (
            topRiskAssets.map((asset, index) => (
              <Paper key={asset.id} p="sm" radius="lg" className="dashboard-panel-soft" withBorder>
                <Group justify="space-between" align="center">
                  <Group gap="sm" align="flex-start">
                    <Text size="lg" fw={900} c="dimmed">
                      {String(index + 1).padStart(2, '0')}
                    </Text>
                    <div>
                      <Text fw={800}>{asset.name}</Text>
                      <Text size="sm" c="dimmed">
                        {asset.value}
                      </Text>
                      <Group gap={6} mt={6}>
                        <Badge size="sm" variant="light">
                          {getAssetTypeLabel(asset.asset_type)}
                        </Badge>
                        <Badge size="sm" variant="light" color={toneColor(getAssetRiskTone(asset.risk_score))}>
                          {asset.risk_score}/100
                        </Badge>
                      </Group>
                    </div>
                  </Group>
                  <Button
                    component={Link}
                    to={`/dashboard/assets/${asset.id}`}
                    size="xs"
                    variant="default"
                    rightSection={<IconArrowUpRight size={14} />}
                  >
                    Open
                  </Button>
                </Group>
              </Paper>
            ))
          ) : (
            <Text c="dimmed">No asset ranking is available yet.</Text>
          )}
        </Stack>

        <Stack gap="xs">
          <Group gap="sm">
            <IconClockHour4 size={16} />
            <Text fw={800}>Coverage gaps</Text>
          </Group>
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

