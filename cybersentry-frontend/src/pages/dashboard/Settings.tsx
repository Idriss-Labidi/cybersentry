import { Group, Paper, SimpleGrid, Switch, Text } from '@mantine/core';
import { IconSettings } from '@tabler/icons-react';
import DashboardPageLayout from '../../layouts/dashboard/DashboardPageLayout';

const settingsCards = [
  {
    title: 'Surface glass effects',
    enabled: true,
    detail: 'Subtle blur and depth on shared navigation and panel surfaces.',
  },
  {
    title: 'Persistent theme mode',
    enabled: true,
    detail: 'Dark and light preference is now stored locally and restored on load.',
  },
  {
    title: 'Compact analytical hierarchy',
    enabled: true,
    detail: 'Tighter layout rhythm for better scan speed across result-heavy pages.',
  },
  {
    title: 'Experimental motion',
    enabled: false,
    detail: 'Reserved for later so the current interaction dynamics stay stable.',
  },
];

export const Settings = () => {
  return (
    <DashboardPageLayout
      icon={<IconSettings size={26} />}
      eyebrow="Settings"
      title="Workspace preferences"
      description="Theme handling, surface defaults, and future workspace options now live inside a more credible settings surface."
      metrics={[
        { label: 'Theme modes', value: '2', hint: 'Persistent dark and light variants' },
        { label: 'Shared tokens', value: 'Centralized', hint: 'Applied across layouts and tool pages' },
        { label: 'UI consistency', value: 'Improved', hint: 'Reduced drift between sections' },
      ]}
    >
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        {settingsCards.map((item) => (
          <Paper key={item.title} p="lg">
            <Group justify="space-between" align="flex-start">
              <Text fw={800}>{item.title}</Text>
              <Switch checked={item.enabled} readOnly />
            </Group>
            <Text c="dimmed" mt="sm">
              {item.detail}
            </Text>
          </Paper>
        ))}
      </SimpleGrid>
    </DashboardPageLayout>
  );
};
