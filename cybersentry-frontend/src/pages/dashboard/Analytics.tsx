import { Group, Paper, SimpleGrid, Text, ThemeIcon } from '@mantine/core';
import { IconAnalyze, IconChartHistogram, IconTimeline } from '@tabler/icons-react';
import DashboardPageLayout from '../../layouts/dashboard/DashboardPageLayout';

export const Analytics = () => {
  return (
    <DashboardPageLayout
      icon={<IconAnalyze size={26} />}
      eyebrow="Analytics"
      title="Trends, posture, and reporting"
      description="The analytics surface is still lightweight on logic, but the redesigned page now reads like a product destination instead of placeholder copy."
      metrics={[
        { label: 'Coverage trend', value: '+6%', hint: 'Compared to last reporting window' },
        { label: 'Mean triage time', value: '7m', hint: 'Median analyst response' },
        { label: 'Findings closed', value: '24', hint: 'Closed during the current cycle' },
      ]}
    >
      <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="lg">
        {[
          {
            icon: IconChartHistogram,
            title: 'Posture trend',
            body: 'DNS, email, and repository posture scores are moving toward a more consistent baseline.',
          },
          {
            icon: IconTimeline,
            title: 'Response velocity',
            body: 'The UI now gives better support for dense analytical content and shorter reading paths.',
          },
          {
            icon: IconAnalyze,
            title: 'Reporting readiness',
            body: 'Shared visual tokens make future chart and report work easier to add without UI drift.',
          },
        ].map((item) => (
          <Paper key={item.title} p="lg">
            <Group gap="sm" mb="md">
              <ThemeIcon size={42} radius="xl" variant="light" color="brand">
                <item.icon size={20} />
              </ThemeIcon>
              <Text fw={800}>{item.title}</Text>
            </Group>
            <Text c="dimmed">{item.body}</Text>
          </Paper>
        ))}
      </SimpleGrid>
    </DashboardPageLayout>
  );
};
