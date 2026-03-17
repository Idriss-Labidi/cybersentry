import { Group, Paper, SimpleGrid, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconActivityHeartbeat, IconRadar2, IconShieldCheck } from '@tabler/icons-react';
import DashboardPageLayout, { DashboardStatCards } from '../components/DashboardPageLayout';

export const Dashboard = () => {
  return (
    <DashboardPageLayout
      icon={<IconRadar2 size={26} />}
      eyebrow="Overview"
      title="Operational security overview"
      description="Track coverage, active investigations, and posture drift from a single workspace without changing your current routing or data flow."
      metrics={[
        { label: 'Active investigations', value: '12', hint: 'Open items requiring review this week' },
        { label: 'Coverage score', value: '94%', hint: 'Controls validated across active checks' },
        { label: 'Mean response', value: '7m', hint: 'Average time to triage' },
      ]}
    >
      <DashboardStatCards
        items={[
          { label: 'Threats escalated', value: '04', hint: 'Escalated in the last 24 hours' },
          { label: 'Resolver anomalies', value: '11', hint: 'Propagation mismatches flagged' },
          { label: 'Mail policy drift', value: '03', hint: 'Domains with changed SPF or DMARC state' },
          { label: 'Repos needing action', value: '02', hint: 'GitHub hygiene findings still open' },
        ]}
      />

      <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="lg">
        <Paper p="lg">
          <Group gap="sm" mb="md">
            <ThemeIcon size={42} radius="xl" variant="light" color="brand">
              <IconActivityHeartbeat size={20} />
            </ThemeIcon>
            <div>
              <Text fw={800}>Live queue</Text>
              <Text size="sm" c="dimmed">
                Investigation lanes sorted by impact.
              </Text>
            </div>
          </Group>
          <Stack gap="sm">
            <Text>Email posture warning on 2 domains</Text>
            <Text>Propagation drift across 5 public resolvers</Text>
            <Text>Repository branch protection missing on one default branch</Text>
          </Stack>
        </Paper>

        <Paper p="lg">
          <Group gap="sm" mb="md">
            <ThemeIcon size={42} radius="xl" variant="light" color="brand">
              <IconShieldCheck size={20} />
            </ThemeIcon>
            <div>
              <Text fw={800}>Control health</Text>
              <Text size="sm" c="dimmed">
                Posture signals normalized across tools.
              </Text>
            </div>
          </Group>
          <Stack gap="sm">
            <Text>SPF alignment stable across core sending domains</Text>
            <Text>DNS score improved 6 points week-over-week</Text>
            <Text>IP scan history remains low risk for the current sprint</Text>
          </Stack>
        </Paper>

        <Paper p="lg">
          <Group gap="sm" mb="md">
            <ThemeIcon size={42} radius="xl" variant="light" color="brand">
              <IconRadar2 size={20} />
            </ThemeIcon>
            <div>
              <Text fw={800}>Operator note</Text>
              <Text size="sm" c="dimmed">
                Design refresh preserves workflow structure.
              </Text>
            </div>
          </Group>
          <Text c="dimmed">
            This page remains intentionally lightweight on logic. The redesign focuses on visual clarity, spacing, and stronger hierarchy while keeping the current dashboard structure intact.
          </Text>
        </Paper>
      </SimpleGrid>
    </DashboardPageLayout>
  );
};
