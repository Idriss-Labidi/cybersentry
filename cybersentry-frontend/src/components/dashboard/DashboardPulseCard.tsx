import { Badge, Group, Paper, RingProgress, SimpleGrid, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconHeartbeat, IconShieldLock, IconSparkles } from '@tabler/icons-react';
import type { DashboardPulse, DashboardTone } from '../../utils/dashboard/overview';
import { formatRelativeTime } from '../../utils/dashboard/overview';

type DashboardPulseCardProps = {
  pulse: DashboardPulse;
  totalAssets: number;
  mostExposedSurface: string;
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
  totalAssets,
  mostExposedSurface,
  lastUpdatedAt,
  className,
}: DashboardPulseCardProps) {
  const pressureDrivers = [
    { label: 'Tracked surfaces', value: `${totalAssets}` },
    { label: 'Dominant surface', value: mostExposedSurface },
    { label: 'Last refresh', value: formatRelativeTime(lastUpdatedAt) },
  ];

  return (
    <Paper p="xl" radius="xl" className={`dashboard-panel dashboard-panel-strong ${className ?? ''}`.trim()}>
      <Stack gap="lg">
        <Stack gap="md" style={{ minWidth: 0 }}>
          <Group gap="sm">
            <ThemeIcon size={54} radius="xl" variant="light" color={toneColor(pulse.tone)}>
              <IconHeartbeat size={24} />
            </ThemeIcon>
            <div>
              <Text size="xs" tt="uppercase" fw={800} c="dimmed" style={{ letterSpacing: '0.08em' }}>
                Security Pulse
              </Text>
              <Text size="xl" fw={900}>
                Workspace pressure is {pulse.label.toLowerCase()}
              </Text>
            </div>
          </Group>

          <Text c="dimmed">
            {pulse.summary}
          </Text>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            {pulse.highlights.map((item) => (
              <Paper key={item.label} p="sm" radius="lg" className="dashboard-panel-soft" withBorder>
                <Text size="xs" tt="uppercase" fw={700} c="dimmed" style={{ letterSpacing: '0.08em' }}>
                  {item.label}
                </Text>
                <Text mt={6} size="lg" fw={800} c={item.tone ? toneColor(item.tone) : undefined}>
                  {item.value}
                </Text>
              </Paper>
            ))}
          </SimpleGrid>

          <Group gap="xs">
            <Badge variant="light" color="brand">
              {totalAssets} assets tracked
            </Badge>
            <Badge variant="light" color="dark">
              Most exposed surface: {mostExposedSurface}
            </Badge>
            <Badge variant="outline" color="gray">
              Updated {formatRelativeTime(lastUpdatedAt)}
            </Badge>
          </Group>
        </Stack>

        <Group align="stretch" gap="md" className="dashboard-pulse-lower" wrap="nowrap">
          <Paper p="lg" radius="xl" className="dashboard-pulse-orb">
            <Stack align="center" gap="xs">
              <RingProgress
                size={190}
                thickness={18}
                roundCaps
                sections={[{ value: pulse.score, color: toneColor(pulse.tone) }]}
                label={
                  <Stack gap={0} align="center">
                    <Text size="xs" tt="uppercase" fw={700} c="dimmed" style={{ letterSpacing: '0.08em' }}>
                      Pulse
                    </Text>
                    <Text size="2rem" fw={900}>
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
                  Current stance: {pulse.label}
                </Text>
              </Group>
            </Stack>
          </Paper>

          <Paper p="md" radius="xl" className="dashboard-panel-soft dashboard-pulse-drivers-wide" withBorder>
            <Group justify="space-between" align="center" mb="sm" gap="sm">
              <Group gap="xs">
                <IconSparkles size={16} />
                <Text size="xs" tt="uppercase" fw={700} c="dimmed" style={{ letterSpacing: '0.08em' }}>
                  Pressure drivers
                </Text>
              </Group>
              <Text size="sm" c="dimmed">
                Core inputs behind the current pulse.
              </Text>
            </Group>

            <SimpleGrid cols={1} spacing="sm">
              {pressureDrivers.map((driver) => (
                <Paper key={driver.label} p="xs" radius="lg" className="dashboard-panel-soft dashboard-pulse-driver-chip" withBorder>
                  <Text size="xs" tt="uppercase" fw={700} c="dimmed" style={{ letterSpacing: '0.08em' }}>
                    {driver.label}
                  </Text>
                  <Text size="md" fw={800} mt={6}>
                    {driver.value}
                  </Text>
                </Paper>
              ))}
            </SimpleGrid>
          </Paper>
        </Group>
      </Stack>
    </Paper>
  );
}
