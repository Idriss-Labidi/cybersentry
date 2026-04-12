import { ActionIcon, Badge, Button, Divider, Group, Indicator, Menu, Stack, Text } from '@mantine/core';
import { IconBell } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../hooks/notifications/useNotifications';
import type { NotificationSeverity } from '../services/notifications';

function getSeverityColor(severity: NotificationSeverity) {
  if (severity === 'high') {
    return 'red';
  }

  if (severity === 'medium') {
    return 'yellow';
  }

  return 'blue';
}

export default function NotificationMenuButton() {
  const { notifications, summary, isLoading, markRead } = useNotifications(4);
  const unreadLabel = summary.unread > 99 ? '99+' : String(summary.unread);
  const indicatorSize = summary.unread > 9 ? 22 : 18;

  return (
    <Menu shadow="md" width={340} position="bottom-end">
      <Menu.Target>
        <Indicator
          inline
          disabled={summary.unread === 0}
          label={unreadLabel}
          size={indicatorSize}
          color="red"
          position="bottom-end"
          offset={6}
          withBorder
          styles={{
            indicator: {
              fontWeight: 800,
              fontSize: summary.unread > 9 ? 10 : 11,
              minWidth: indicatorSize,
              height: indicatorSize,
              paddingInline: 0,
            },
          }}
        >
          <ActionIcon
            variant="default"
            radius="xl"
            size={42}
            aria-label="Open notifications"
            styles={{
              root: {
                position: 'relative',
                background: 'var(--app-surface-soft)',
                borderColor: 'var(--app-border)',
              },
            }}
          >
            <IconBell size={18} />
          </ActionIcon>
        </Indicator>
      </Menu.Target>

      <Menu.Dropdown p="md">
        <Stack gap="sm">
          <div>
            <Text size="sm" fw={800}>
              Recent notifications
            </Text>
          </div>

          {isLoading ? (
            <Text size="sm" c="dimmed">
              Loading notifications...
            </Text>
          ) : notifications.length === 0 ? (
            <Text size="sm" c="dimmed">
              No notifications yet.
            </Text>
          ) : (
            notifications.map((notification, index) => (
              <div key={notification.id}>
                {index > 0 ? <Divider my="sm" /> : null}
                <Stack gap={6}>
                  <Group justify="space-between" align="flex-start" gap="sm">
                    <Text size="sm" fw={700} style={{ flex: 1 }}>
                      {notification.title}
                    </Text>
                    <Badge color={getSeverityColor(notification.severity)}>
                      {notification.severity.toUpperCase()}
                    </Badge>
                  </Group>
                  <Text size="xs" c="dimmed">
                    {notification.detail}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {new Date(notification.created_at).toLocaleString()}
                  </Text>
                  {!notification.is_read ? (
                    <Group justify="flex-end">
                      <Button variant="subtle" size="compact-xs" onClick={() => void markRead(notification.id)}>
                        Mark as read
                      </Button>
                    </Group>
                  ) : null}
                </Stack>
              </div>
            ))
          )}

          <Divider />

          <Button
            component={Link}
            to="/dashboard/alerts"
            variant="light"
            fullWidth
          >
            Open Alerts
          </Button>
        </Stack>
      </Menu.Dropdown>
    </Menu>
  );
}
