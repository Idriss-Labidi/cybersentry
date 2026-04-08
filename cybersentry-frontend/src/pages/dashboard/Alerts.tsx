import { Badge, Button, Group, Paper, Stack, Text } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import DashboardPageLayout, { DashboardStatCards } from '../../layouts/dashboard/DashboardPageLayout';
import { useNotifications } from '../../hooks/notifications/useNotifications';

function severityColor(severity: 'low' | 'medium' | 'high') {
  if (severity === 'high') {
    return 'red';
  }
  if (severity === 'medium') {
    return 'yellow';
  }
  return 'blue';
}

export const Alerts = () => {
  const { notifications, summary, isLoading, markRead, markAllRead } = useNotifications(100);

  return (
    <DashboardPageLayout
      icon={<IconAlertTriangle size={26} />}
      eyebrow="Alerts"
      title="Security alerts and notifications"
      description="Review low-score test alerts and notification delivery status."
      metrics={[
        { label: 'Open alerts', value: String(summary.unread), hint: 'Unread in-app notifications' },
        { label: 'Critical', value: String(summary.critical), hint: 'High severity low-score events' },
        { label: 'Total', value: String(summary.total), hint: 'Stored notification events' },
      ]}
    >
      <DashboardStatCards
        items={[
          {
            label: 'Unread',
            value: String(summary.unread),
            hint: 'Events waiting for acknowledgment',
          },
          { label: 'Critical', value: String(summary.critical), hint: 'Score <= 30/100 alerts' },
          { label: 'All alerts', value: String(summary.total), hint: 'Current user and organization' },
          { label: 'Webhook/Email', value: 'Tracked', hint: 'Delivery status on each event' },
        ]}
      />

      <Group justify="flex-end">
        <Button variant="light" onClick={() => void markAllRead()}>
          Mark all as read
        </Button>
      </Group>

      <Stack gap="lg">
        {isLoading ? <Text c="dimmed">Loading alerts...</Text> : null}
        {!isLoading && notifications.length === 0 ? <Text c="dimmed">No alerts yet.</Text> : null}
        {notifications.map((alert) => (
          <Paper key={alert.id} p="lg">
            <Group justify="space-between" align="flex-start">
              <div>
                <Text fw={800}>{alert.title}</Text>
                <Text c="dimmed" mt="sm">
                  {alert.detail}
                </Text>
                <Text c="dimmed" size="sm" mt="sm">
                  {new Date(alert.created_at).toLocaleString()} - score {alert.score}/100
                </Text>
                <Text c="dimmed" size="sm" mt="sm">
                  Email: {alert.email_status} | Webhook: {alert.webhook_status}
                </Text>
              </div>
              <Stack align="flex-end" gap="xs">
                <Badge color={severityColor(alert.severity)}>{alert.severity.toUpperCase()}</Badge>
                {!alert.is_read ? (
                  <Button variant="subtle" size="compact-xs" onClick={() => void markRead(alert.id)}>
                    Mark as read
                  </Button>
                ) : null}
              </Stack>
            </Group>
          </Paper>
        ))}
      </Stack>
    </DashboardPageLayout>
  );
};
