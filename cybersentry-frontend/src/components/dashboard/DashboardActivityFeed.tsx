import { Badge, Button, Group, Paper, Stack, Text } from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import type { DashboardFeedItem } from '../../utils/dashboard/overview';

type DashboardActivityFeedProps = {
  items: DashboardFeedItem[];
  unreadAlerts: number;
  criticalAlerts: number;
  activeIncidents: number;
  className?: string;
};

function toneColor(tone: DashboardFeedItem['tone']) {
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

export function DashboardActivityFeed({
  items,
  unreadAlerts,
  criticalAlerts,
  activeIncidents,
  className,
}: DashboardActivityFeedProps) {
  return (
    <Paper p="xl" radius="xl" className={`dashboard-panel ${className ?? ''}`.trim()}>
      <Stack gap="lg">
        <div>
          <Text size="xs" tt="uppercase" fw={800} c="dimmed" style={{ letterSpacing: '0.08em' }}>
            Live Activity
          </Text>
          <Text fw={900} size="xl">
            Signals moving through the workspace
          </Text>
        </div>

        <Group gap="xs">
          <Badge variant="light" color={criticalAlerts > 0 ? 'red' : 'gray'}>
            {criticalAlerts} critical alerts
          </Badge>
          <Badge variant="light" color={unreadAlerts > 0 ? 'yellow' : 'gray'}>
            {unreadAlerts} unread
          </Badge>
          <Badge variant="light" color={activeIncidents > 0 ? 'orange' : 'gray'}>
            {activeIncidents} active incidents
          </Badge>
        </Group>

        <Stack gap="sm">
          {items.length > 0 ? (
            items.map((item) => (
              <Paper key={item.id} p="md" radius="lg" className="dashboard-feed-item" withBorder>
                <Group justify="space-between" align="flex-start" gap="md">
                  <div style={{ flex: 1 }}>
                    <Group gap={8} mb={6}>
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 999,
                          display: 'inline-block',
                          background: `var(--mantine-color-${toneColor(item.tone)}-6)`,
                        }}
                      />
                      <Text fw={800}>{item.title}</Text>
                    </Group>
                    <Text size="sm" c="dimmed">
                      {item.detail}
                    </Text>
                    <Text size="xs" c="dimmed" mt={8}>
                      {item.meta}
                    </Text>
                  </div>
                  <Button
                    component={Link}
                    to={item.href}
                    size="xs"
                    variant="subtle"
                    rightSection={<IconArrowRight size={14} />}
                  >
                    Open
                  </Button>
                </Group>
              </Paper>
            ))
          ) : (
            <Text c="dimmed">No recent activity is available yet.</Text>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}

