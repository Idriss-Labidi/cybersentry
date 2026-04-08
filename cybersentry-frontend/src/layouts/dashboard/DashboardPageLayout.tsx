import type { ReactNode } from 'react';
import { Container, Group, Paper, SimpleGrid, Stack, Text } from '@mantine/core';
import PageHero, { type HeroMetric } from '../../components/PageHero';
import { GuidanceGroup, type GuidanceItem } from '../../components/guidance/GuidanceHoverCard';

type DashboardPageLayoutProps = {
  icon: ReactNode;
  eyebrow?: string;
  title: string;
  description: string;
  metrics?: HeroMetric[];
  guidance?: GuidanceItem[];
  actions?: ReactNode;
  children: ReactNode;
};

export default function DashboardPageLayout({
  icon,
  eyebrow,
  title,
  description,
  metrics = [],
  guidance = [],
  actions,
  children,
}: DashboardPageLayoutProps) {
  return (
    <Container size="xl" py="xl" className="app-page">
      <Stack gap="xl">
        <PageHero
          icon={icon}
          eyebrow={eyebrow}
          title={title}
          description={description}
          supplementary={<GuidanceGroup items={guidance} />}
          metrics={metrics}
          actions={actions}
        />
        {children}
      </Stack>
    </Container>
  );
}

export function DashboardStatCards({
  items,
}: {
  items: Array<{ label: string; value: string; hint?: string }>;
}) {
  return (
    <SimpleGrid cols={{ base: 1, md: 2, xl: 4 }} spacing="lg">
      {items.map((item) => (
        <Paper key={item.label} p="lg" radius="xl">
          <Text size="xs" tt="uppercase" fw={800} c="dimmed" style={{ letterSpacing: '0.08em' }}>
            {item.label}
          </Text>
          <Group justify="space-between" mt="sm" align="flex-end">
            <Text size="xl" fw={800}>
              {item.value}
            </Text>
          </Group>
          {item.hint ? (
            <Text size="sm" c="dimmed" mt={6}>
              {item.hint}
            </Text>
          ) : null}
        </Paper>
      ))}
    </SimpleGrid>
  );
}
