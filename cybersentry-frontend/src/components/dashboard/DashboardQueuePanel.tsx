import { Badge, Button, Group, Paper, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconAlertTriangle, IconArrowRight, IconClockCog, IconLifebuoy } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import type { DashboardQueueItem } from '../../utils/dashboard/overview';

type DashboardQueuePanelProps = {
  items: DashboardQueueItem[];
  className?: string;
};

function itemToneColor(tone: DashboardQueueItem['tone']) {
  switch (tone) {
    case 'red':
      return 'red';
    case 'orange':
      return 'orange';
    case 'yellow':
      return 'yellow';
    case 'blue':
      return 'blue';
    default:
      return 'green';
  }
}

function itemIcon(kind: DashboardQueueItem['kind']) {
  if (kind === 'incident') {
    return IconLifebuoy;
  }
  if (kind === 'coverage') {
    return IconClockCog;
  }
  return IconAlertTriangle;
}

export function DashboardQueuePanel({ items, className }: DashboardQueuePanelProps) {
  return (
    <Paper p="xl" radius="xl" className={`dashboard-panel ${className ?? ''}`.trim()}>
      <Stack gap="lg">
        <div>
          <Text size="xs" tt="uppercase" fw={800} c="dimmed" style={{ letterSpacing: '0.08em' }}>
            Action Queue
          </Text>
          <Text fw={900} size="xl">
            What deserves attention next
          </Text>
          <Text size="sm" c="dimmed" mt={4}>
            This queue blends incidents, alerts, and visibility gaps into one operational view.
          </Text>
        </div>

        <Stack gap="sm">
          {items.length > 0 ? (
            items.map((item) => {
              const Icon = itemIcon(item.kind);
              return (
                <Paper key={item.id} p="md" radius="lg" className="dashboard-queue-item" withBorder>
                  <Group justify="space-between" align="flex-start" gap="md">
                    <Group gap="sm" align="flex-start" style={{ flex: 1 }}>
                      <ThemeIcon size={42} radius="xl" variant="light" color={itemToneColor(item.tone)}>
                        <Icon size={18} />
                      </ThemeIcon>
                      <div style={{ flex: 1 }}>
                        <Group gap={8} mb={6}>
                          <Text fw={800}>{item.title}</Text>
                          <Badge color={itemToneColor(item.tone)} variant="light">
                            {item.kind}
                          </Badge>
                        </Group>
                        <Text size="sm" c="dimmed">
                          {item.detail}
                        </Text>
                        <Text size="xs" c="dimmed" mt={8}>
                          {item.meta}
                        </Text>
                      </div>
                    </Group>
                    <Button
                      component={Link}
                      to={item.href}
                      size="xs"
                      variant="default"
                      rightSection={<IconArrowRight size={14} />}
                    >
                      {item.actionLabel}
                    </Button>
                  </Group>
                </Paper>
              );
            })
          ) : (
            <Text c="dimmed">Nothing is currently waiting in the action queue.</Text>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}

