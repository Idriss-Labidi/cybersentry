import { Badge, Button, Divider, Group, Menu, Stack, Text } from '@mantine/core';
import { IconBell } from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getVisibleDashboardNotifications,
  type DashboardNotification,
} from '../data/dashboard-notifications';
import {
  NOTIFICATION_PREFERENCES_EVENT,
  readNotificationPreferences,
  type NotificationPreferences,
} from '../utils/notification-preferences';

function getSeverityColor(severity: DashboardNotification['severity']) {
  if (severity === 'High') {
    return 'red';
  }

  if (severity === 'Medium') {
    return 'yellow';
  }

  return 'blue';
}

export default function NotificationMenuButton() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    readNotificationPreferences
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const syncPreferences = () => {
      setPreferences(readNotificationPreferences());
    };

    const handleStorage = () => {
      syncPreferences();
    };

    window.addEventListener(NOTIFICATION_PREFERENCES_EVENT, syncPreferences);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(NOTIFICATION_PREFERENCES_EVENT, syncPreferences);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const notifications = useMemo(
    () => getVisibleDashboardNotifications(preferences).slice(0, 4),
    [preferences]
  );

  return (
    <Menu shadow="md" width={340} position="bottom-end">
      <Menu.Target>
        <Button
          variant="default"
          leftSection={<IconBell size={16} />}
          aria-label="Open notifications"
        >
          {notifications.length > 0
            ? `(${notifications.length})`
            : ''}
        </Button>
      </Menu.Target>

      <Menu.Dropdown p="md">
        <Stack gap="sm">
          <div>
            <Text size="sm" fw={800}>
              Recent notifications
            </Text>
            <Text size="xs" c="dimmed" mt={4}>
              Filtered by the notification preferences set in Settings.
            </Text>
          </div>

          {notifications.length === 0 ? (
            <Text size="sm" c="dimmed">
              No notifications match your current preferences.
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
                      {notification.severity}
                    </Badge>
                  </Group>
                  <Text size="xs" c="dimmed">
                    {notification.detail}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {notification.timeLabel}
                  </Text>
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
