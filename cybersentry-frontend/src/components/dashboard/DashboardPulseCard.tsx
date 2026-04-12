import { Group, Paper, RingProgress, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconHeartbeat, IconShieldLock } from '@tabler/icons-react';
import type { DashboardPulse, DashboardTone } from '../../utils/dashboard/overview';
import { formatRelativeTime } from '../../utils/dashboard/overview';

type DashboardPulseCardProps = {
  pulse: DashboardPulse;
  assetClassCount: number;
  lastUpdatedAt: string | null;
  className?: string;
};

function toneColor(tone: DashboardTone) {
  switch (tone) {
    case 'green':
      return 'green';
    case 'yellow':
      return 'yellow';
    case 'orange':
      return 'orange';
    case 'red':
      return 'red';
    case 'blue':
      return 'blue';
    default:
      return 'gray';
  }
}

export function DashboardPulseCard({
  pulse,
  assetClassCount,
  lastUpdatedAt,
  className,
}: DashboardPulseCardProps) {
  const postureIndicators = [
    pulse.highlights[0] ?? { label: 'Coverage', value: '0%' },
    pulse.highlights[1] ?? { label: 'Average risk', value: '0/100' },
    pulse.highlights[2] ?? { label: 'High-risk assets', value: '0' },
  ];

  return (
    <Paper p="xl" radius="xl" className={`dashboard-panel dashboard-panel-strong ${className ?? ''}`.trim()}>
      <Group justify="space-between" align="center" gap="xl" wrap="nowrap" className="dashboard-pulse-layout">
        <Stack gap="md" style={{ flex: 1, minWidth: 0 }}>
          <Group gap="sm">
            <ThemeIcon size={54} radius="xl" variant="light" color={toneColor(pulse.tone)}>
              <IconHeartbeat size={24} />
            </ThemeIcon>
            <div>
              <Text size="xs" tt="uppercase" fw={800} c="dimmed" style={{ letterSpacing: '0.08em' }}>
                Security Pulse
              </Text>
              <Text size="xl" fw={900}>
                Workspace is {pulse.label.toLowerCase()}
              </Text>
            </div>
          </Group>

          <Text size="sm" c="dimmed" maw={520}>
            {pulse.summary}
          </Text>

          <Group gap="sm" wrap="wrap">
            {postureIndicators.map((item) => (
              <Paper key={item.label} p="sm" radius="lg" className="dashboard-panel-soft dashboard-pulse-chip" withBorder>
                <Text size="xs" tt="uppercase" fw={700} c="dimmed" style={{ letterSpacing: '0.08em' }}>
                  {item.label}
                </Text>
                <Text mt={6} size="lg" fw={800}>
                  {item.value}
                </Text>
              </Paper>
            ))}
          </Group>

          <Group gap="md" wrap="wrap" className="dashboard-pulse-meta-line">
            <Text size="sm" c="dimmed">
              <Text span fw={800} c="inherit">
                {assetClassCount}
              </Text>{' '}
              classes
            </Text>
            <Text size="sm" c="dimmed">
              <Text span fw={800} c="inherit">
                {formatRelativeTime(lastUpdatedAt)}
              </Text>{' '}
              refresh
            </Text>
          </Group>
        </Stack>

        <Paper p="md" radius="xl" className="dashboard-pulse-orb">
          <Stack align="center" gap="xs">
            <RingProgress
              size={162}
              thickness={16}
              roundCaps
              sections={[{ value: pulse.score, color: toneColor(pulse.tone) }]}
              label={
                <Stack gap={0} align="center">
                  <Text size="xs" tt="uppercase" fw={700} c="dimmed" style={{ letterSpacing: '0.08em' }}>
                    Pulse
                  </Text>
                  <Text size="1.95rem" fw={900}>
                    {pulse.score}
                  </Text>
                  <Text size="sm" c="dimmed">
                    /100
                  </Text>
                </Stack>
              }
            />
            <Group gap={6}>
              <IconShieldLock size={16} />
              <Text size="sm" fw={700}>
                {pulse.label}
              </Text>
            </Group>
          </Stack>
        </Paper>
      </Group>
    </Paper>
  );
}
