import { Badge, Group, Paper, SimpleGrid, Text } from '@mantine/core';
import { IconShield } from '@tabler/icons-react';
import DashboardPageLayout from '../../layouts/dashboard/DashboardPageLayout';

export const Security = () => {
  return (
    <DashboardPageLayout
      icon={<IconShield size={26} />}
      eyebrow="Security"
      title="Security controls and policy posture"
      description="A cleaner security page makes room for policy state, review summaries, and future configuration controls without changing the current navigation model."
      metrics={[
        { label: 'Policies monitored', value: '27', hint: 'Across DNS, mail, IP, and repo checks' },
        { label: 'Healthy controls', value: '22', hint: 'Passing current evaluation criteria' },
        { label: 'Needs review', value: '05', hint: 'Recommended for manual validation' },
      ]}
    >
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        {[
          ['Email authentication', 'Stable', 'SPF and DKIM records are aligned on monitored domains.'],
          ['DNS resilience', 'Review', 'Resolver consistency still varies across selected regions.'],
          ['Repository hygiene', 'Stable', 'Most repositories are scoring inside the target risk band.'],
          ['Incident workflow', 'Improving', 'Workspace hierarchy is now clearer for repeat use.'],
        ].map(([title, state, detail]) => (
          <Paper key={title} p="lg">
            <Group justify="space-between" align="flex-start">
              <Text fw={800}>{title}</Text>
              <Badge color={state === 'Stable' ? 'green' : state === 'Review' ? 'yellow' : 'blue'}>
                {state}
              </Badge>
            </Group>
            <Text c="dimmed" mt="sm">
              {detail}
            </Text>
          </Paper>
        ))}
      </SimpleGrid>
    </DashboardPageLayout>
  );
};
