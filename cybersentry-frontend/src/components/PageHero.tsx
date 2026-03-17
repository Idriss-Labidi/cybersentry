import type { ReactNode } from 'react';
import {
  Badge,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';

export type HeroMetric = {
  label: string;
  value: string;
  hint?: string;
  tone?: string;
};

type PageHeroProps = {
  icon: ReactNode;
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
  metrics?: HeroMetric[];
};

export default function PageHero({
  icon,
  eyebrow,
  title,
  description,
  actions,
  metrics = [],
}: PageHeroProps) {
  return (
    <Paper className="app-hero-card" p={{ base: 'lg', sm: 'xl' }} radius="xl">
      <Stack gap="xl">
        <Group justify="space-between" align="flex-start">
          <Stack gap="md" maw={760}>
            <Group gap="sm">
              <ThemeIcon
                size={52}
                radius="xl"
                variant="light"
                color="brand"
                style={{ background: 'var(--app-hover-fill)' }}
              >
                {icon}
              </ThemeIcon>

              {eyebrow ? (
                <Badge
                  size="lg"
                  variant="light"
                  color="brand"
                  style={{ background: 'var(--app-badge-fill)' }}
                >
                  {eyebrow}
                </Badge>
              ) : null}
            </Group>

            <div>
              <Title order={1} style={{ letterSpacing: '-0.05em' }}>
                {title}
              </Title>
              <Text mt="sm" size="md" c="dimmed" maw={680}>
                {description}
              </Text>
            </div>
          </Stack>

          {actions ? <Group gap="sm">{actions}</Group> : null}
        </Group>

        {metrics.length > 0 ? (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: Math.min(metrics.length, 4) }} spacing="md">
            {metrics.map((metric) => (
              <Paper
                key={`${metric.label}-${metric.value}`}
                p="md"
                radius="lg"
                style={{
                  background: 'var(--app-surface-soft)',
                  borderColor: 'var(--app-border)',
                }}
              >
                <Text size="xs" tt="uppercase" fw={700} c="dimmed" style={{ letterSpacing: '0.08em' }}>
                  {metric.label}
                </Text>
                <Text mt={8} size="xl" fw={800} c={metric.tone || 'inherit'}>
                  {metric.value}
                </Text>
                {metric.hint ? (
                  <Text mt={4} size="sm" c="dimmed">
                    {metric.hint}
                  </Text>
                ) : null}
              </Paper>
            ))}
          </SimpleGrid>
        ) : null}
      </Stack>
    </Paper>
  );
}
