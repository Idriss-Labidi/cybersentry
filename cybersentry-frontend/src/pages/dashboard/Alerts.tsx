import { Badge, Group, Paper, Stack, Text } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import DashboardPageLayout, { DashboardStatCards } from '../../layouts/dashboard/DashboardPageLayout';

const alerts = [
  { title: 'Suspicious mail policy change', severity: 'High', detail: 'DMARC policy moved from quarantine to none on a monitored domain.' },
  { title: 'Resolver divergence', severity: 'Medium', detail: 'A record mismatch across public resolver groups in two regions.' },
  { title: 'Repository hygiene drift', severity: 'Low', detail: 'Default branch protection missing after a recent repo configuration update.' },
];

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
        {alerts.map((alert) => (
          <Paper key={alert.title} p="lg">
            <Group justify="space-between" align="flex-start">
              <div>
                <Text fw={800}>{alert.title}</Text>
                <Text c="dimmed" mt="sm">
                  {alert.detail}
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
