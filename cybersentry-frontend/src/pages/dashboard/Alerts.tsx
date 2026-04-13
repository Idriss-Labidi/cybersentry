import { useState } from 'react';
import { Badge, Button, Group, Paper, ScrollArea, Stack, Table, Text } from '@mantine/core';
import { IconAlertTriangle, IconLayoutKanban, IconList } from '@tabler/icons-react';
import { DashboardViewModeToggle } from '../../components/dashboard/DashboardViewModeToggle';
import DashboardPageLayout, { DashboardStatCards } from '../../layouts/dashboard/DashboardPageLayout';
import type { NotificationEvent, NotificationSeverity } from '../../services/notifications';
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

const ALERT_BOARD_COLUMNS: NotificationSeverity[] = ['high', 'medium', 'low'];

const formatAlertTimestamp = (value: string) => new Date(value).toLocaleString();

type AlertsViewProps = {
  notifications: NotificationEvent[];
  onMarkRead: (id: number) => void;
};

function AlertsTableView({ notifications, onMarkRead }: AlertsViewProps) {
  return (
    <ScrollArea>
      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Alert</Table.Th>
            <Table.Th>Severity</Table.Th>
            <Table.Th>Delivery</Table.Th>
            <Table.Th>Created</Table.Th>
            <Table.Th style={{ textAlign: 'center' }}>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {notifications.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={5}>
                <Text c="dimmed">No alerts yet.</Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            notifications.map((alert) => (
              <Table.Tr key={alert.id}>
                <Table.Td>
                  <Stack gap={4}>
                    <Text fw={700}>{alert.title}</Text>
                    <Text size="sm" c="dimmed">
                      {alert.detail}
                    </Text>
                    <Group gap={6}>
                      <Badge variant="light">{alert.test_type_label}</Badge>
                      <Badge variant={alert.is_read ? 'outline' : 'light'} color={alert.is_read ? 'gray' : 'blue'}>
                        {alert.is_read ? 'Read' : 'Unread'}
                      </Badge>
                    </Group>
                  </Stack>
                </Table.Td>
                <Table.Td>
                  <Badge color={severityColor(alert.severity)}>{alert.severity.toUpperCase()}</Badge>
                </Table.Td>
                <Table.Td>
                  <Stack gap={4}>
                    <Text size="sm">Email: {alert.email_status}</Text>
                    <Text size="sm">Webhook: {alert.webhook_status}</Text>
                  </Stack>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{formatAlertTimestamp(alert.created_at)}</Text>
                </Table.Td>
                <Table.Td style={{ textAlign: 'center' }}>
                  {!alert.is_read ? (
                    <Button variant="subtle" size="compact-sm" onClick={() => onMarkRead(alert.id)}>
                      Mark as read
                    </Button>
                  ) : (
                    <Text size="sm" c="dimmed">
                      Cleared
                    </Text>
                  )}
                </Table.Td>
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
}

function AlertsListView({ notifications, onMarkRead }: AlertsViewProps) {
  return (
    <Stack gap="lg">
      {notifications.length === 0 ? <Text c="dimmed">No alerts yet.</Text> : null}
      {notifications.map((alert) => (
        <Paper key={alert.id} p="lg" withBorder>
          <Group justify="space-between" align="flex-start">
            <div>
              <Text fw={800}>{alert.title}</Text>
              <Text c="dimmed" mt="sm">
                {alert.detail}
              </Text>
              <Group gap={6} mt="sm">
                <Badge color={severityColor(alert.severity)}>{alert.severity.toUpperCase()}</Badge>
                <Badge variant="light">{alert.test_type_label}</Badge>
                <Badge variant={alert.is_read ? 'outline' : 'light'} color={alert.is_read ? 'gray' : 'blue'}>
                  {alert.is_read ? 'Read' : 'Unread'}
                </Badge>
              </Group>
              <Text c="dimmed" size="sm" mt="sm">
                {formatAlertTimestamp(alert.created_at)} - score {alert.score}/100
              </Text>
              <Text c="dimmed" size="sm" mt="sm">
                Email: {alert.email_status} | Webhook: {alert.webhook_status}
              </Text>
            </div>
            {!alert.is_read ? (
              <Button variant="subtle" size="compact-xs" onClick={() => onMarkRead(alert.id)}>
                Mark as read
              </Button>
            ) : null}
          </Group>
        </Paper>
      ))}
    </Stack>
  );
}

function AlertsBoardView({ notifications, onMarkRead }: AlertsViewProps) {
  return (
    <ScrollArea>
      <Group align="flex-start" gap="md" wrap="nowrap">
        {ALERT_BOARD_COLUMNS.map((severity) => {
          const columnAlerts = notifications.filter((alert) => alert.severity === severity);

          return (
            <Paper key={severity} p="md" radius="lg" withBorder style={{ minWidth: 300, width: 300 }}>
              <Stack gap="md">
                <Group justify="space-between" align="center">
                  <Badge color={severityColor(severity)}>{severity.toUpperCase()}</Badge>
                  <Badge variant="light">{columnAlerts.length}</Badge>
                </Group>

                <Stack gap="sm">
                  {columnAlerts.length === 0 ? (
                    <Text size="sm" c="dimmed">
                      No alerts in this lane.
                    </Text>
                  ) : (
                    columnAlerts.map((alert) => (
                      <Paper key={alert.id} p="sm" radius="md" withBorder>
                        <Stack gap="sm">
                          <div>
                            <Text fw={700}>{alert.title}</Text>
                            <Text size="sm" c="dimmed" mt={4}>
                              {alert.detail}
                            </Text>
                          </div>

                          <Group gap={6}>
                            <Badge variant="light">{alert.test_type_label}</Badge>
                            <Badge variant={alert.is_read ? 'outline' : 'light'} color={alert.is_read ? 'gray' : 'blue'}>
                              {alert.is_read ? 'Read' : 'Unread'}
                            </Badge>
                          </Group>

                          <Text size="xs" c="dimmed">
                            {formatAlertTimestamp(alert.created_at)}
                          </Text>

                          {!alert.is_read ? (
                            <Button variant="subtle" size="compact-sm" onClick={() => onMarkRead(alert.id)}>
                              Mark as read
                            </Button>
                          ) : null}
                        </Stack>
                      </Paper>
                    ))
                  )}
                </Stack>
              </Stack>
            </Paper>
          );
        })}
      </Group>
    </ScrollArea>
  );
}

export const Alerts = () => {
  const [viewMode, setViewMode] = useState<'table' | 'list' | 'board'>('list');
  const { notifications, summary, isLoading, markRead, markAllRead } = useNotifications(100);

  return (
    <DashboardPageLayout
      icon={<IconAlertTriangle size={26} />}
      eyebrow="Alerts"
      title="Security alerts and notifications"
      description="Review low-score test alerts and notification delivery status."
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

      <Paper p="lg" radius="xl">
        <Stack gap="md">
          <DashboardViewModeToggle
            value={viewMode}
            onChange={(value) => setViewMode(value as 'table' | 'list' | 'board')}
            options={[
              { label: 'Table', value: 'table', leftSection: <IconList size={14} /> },
              { label: 'List', value: 'list', leftSection: <IconAlertTriangle size={14} /> },
              { label: 'Board', value: 'board', leftSection: <IconLayoutKanban size={14} /> },
            ]}
          />

          {isLoading ? <Text c="dimmed">Loading alerts...</Text> : null}
          {!isLoading && viewMode === 'table' ? <AlertsTableView notifications={notifications} onMarkRead={(id) => void markRead(id)} /> : null}
          {!isLoading && viewMode === 'list' ? <AlertsListView notifications={notifications} onMarkRead={(id) => void markRead(id)} /> : null}
          {!isLoading && viewMode === 'board' ? <AlertsBoardView notifications={notifications} onMarkRead={(id) => void markRead(id)} /> : null}
        </Stack>
      </Paper>
    </DashboardPageLayout>
  );
};
