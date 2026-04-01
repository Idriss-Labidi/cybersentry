import { Badge, Group, Paper, Stack, Text } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import DashboardPageLayout, { DashboardStatCards } from '../../layouts/dashboard/DashboardPageLayout';
import { dashboardNotifications } from '../../data/dashboard-notifications';

export const Alerts = () => {
  return (
    <DashboardPageLayout
      icon={<IconAlertTriangle size={26} />}
      eyebrow="Alerts"
      title="Security alerts and notifications"
      description="Review the current alert stream with clearer severity signaling and more deliberate visual hierarchy."
      metrics={[
        { label: 'Open alerts', value: '18', hint: 'Across public tools and authenticated checks' },
        { label: 'Critical', value: '03', hint: 'Require same-day response' },
        { label: 'Muted', value: '11', hint: 'Low priority informational events' },
      ]}
    >
      <DashboardStatCards
        items={[
          { label: 'Email', value: '06', hint: 'SPF, DKIM, DMARC related findings' },
          { label: 'DNS', value: '08', hint: 'Propagation and resolver anomalies' },
          { label: 'GitHub', value: '04', hint: 'Repository health and security findings' },
          { label: 'Escalated today', value: '02', hint: 'Moved to active investigation' },
        ]}
      />

      <Stack gap="lg">
        {dashboardNotifications.map((alert) => (
          <Paper key={alert.id} p="lg">
            <Group justify="space-between" align="flex-start">
              <div>
                <Text fw={800}>{alert.title}</Text>
                <Text c="dimmed" mt="sm">
                  {alert.detail}
                </Text>
                <Text c="dimmed" size="sm" mt="sm">
                  {alert.timeLabel}
                </Text>
              </div>
              <Badge color={alert.severity === 'High' ? 'red' : alert.severity === 'Medium' ? 'yellow' : 'blue'}>
                {alert.severity}
              </Badge>
            </Group>
          </Paper>
        ))}
      </Stack>
    </DashboardPageLayout>
  );
};
