import type { ReactNode } from 'react';
import { Group, Paper, Stack, Text } from '@mantine/core';

type AnalyticsSectionCardProps = {
  title: string;
  description: string;
  eyebrow?: string;
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
};

export function AnalyticsSectionCard({
  title,
  description,
  eyebrow,
  aside,
  className,
  children,
}: AnalyticsSectionCardProps) {
  return (
    <Paper p="xl" radius="xl" className={`dashboard-panel analytics-section-card ${className ?? ''}`.trim()}>
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start" gap="md" wrap="nowrap">
          <div style={{ minWidth: 0 }}>
            {eyebrow ? (
              <Text size="xs" tt="uppercase" fw={800} c="dimmed" style={{ letterSpacing: '0.08em' }}>
                {eyebrow}
              </Text>
            ) : null}
            <Text fw={900} size="xl">
              {title}
            </Text>
            <Text size="sm" c="dimmed" mt={4}>
              {description}
            </Text>
          </div>

          {aside ? <div>{aside}</div> : null}
        </Group>

        {children}
      </Stack>
    </Paper>
  );
}