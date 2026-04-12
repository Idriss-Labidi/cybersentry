import { Badge, Group, Paper, SimpleGrid, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconBroadcast, IconLayersIntersect, IconTargetArrow } from '@tabler/icons-react';

type DashboardFocusCardProps = {
  criticalIncidents: number;
  unreadAlerts: number;
  uncoveredAssets: number;
  highRiskAssets: number;
  totalAssets: number;
  productionAssets: number;
  dominantSurface: string;
  className?: string;
};

export function DashboardFocusCard({
  criticalIncidents,
  unreadAlerts,
  uncoveredAssets,
  highRiskAssets,
  totalAssets,
  productionAssets,
  dominantSurface,
  className,
}: DashboardFocusCardProps) {
  let title = 'Reduce inventory risk';
  let description = 'High-risk assets are the next pressure point. Review and stabilize the exposed set first.';
  let badge = 'Inventory';

  if (criticalIncidents > 0) {
    title = 'Handle incident response first';
    description = 'Critical incidents are the main blocker right now. Resolve response pressure before anything else.';
    badge = 'Response';
  } else if (uncoveredAssets > 0) {
    title = 'Close monitoring blind spots';
    description = 'Visibility gaps are the main weakness right now. Bring uncovered assets back into active monitoring.';
    badge = 'Coverage';
  } else if (unreadAlerts > 0) {
    title = 'Triage the alert queue';
    description = 'Unread alerts are the next source of drift. Clear the queue before it becomes background noise.';
    badge = 'Alerts';
  } else if (highRiskAssets === 0) {
    title = 'Keep posture stable';
    description = 'No immediate spike is dominating the workspace. Use the cockpit to keep coverage and response tidy.';
    badge = 'Stable';
  }

  return (
    <Paper p="lg" radius="xl" className={`dashboard-panel dashboard-panel-soft ${className ?? ''}`.trim()} withBorder>
      <Stack gap="md">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            <ThemeIcon size={42} radius="xl" variant="light" color="brand">
              <IconTargetArrow size={20} />
            </ThemeIcon>
            <div>
              <Text size="xs" tt="uppercase" fw={800} c="dimmed" style={{ letterSpacing: '0.08em' }}>
                Recommended focus
              </Text>
              <Text fw={900} size="lg">
                {title}
              </Text>
            </div>
          </Group>

          <Badge variant="light" color="brand">
            {badge}
          </Badge>
        </Group>

        <Text size="sm" c="dimmed" maw={680}>
          {description}
        </Text>

        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
          <Paper p="sm" radius="lg" className="dashboard-panel-soft dashboard-focus-signal" withBorder>
            <Text size="xs" tt="uppercase" fw={700} c="dimmed" style={{ letterSpacing: '0.08em' }}>
              Managed assets
            </Text>
            <Text mt={6} size="lg" fw={800}>
              {totalAssets}
            </Text>
          </Paper>

          <Paper p="sm" radius="lg" className="dashboard-panel-soft dashboard-focus-signal" withBorder>
            <Group gap={8} wrap="nowrap">
              <IconBroadcast size={15} />
              <Text size="xs" tt="uppercase" fw={700} c="dimmed" style={{ letterSpacing: '0.08em' }}>
                Production
              </Text>
            </Group>
            <Text mt={6} size="lg" fw={800}>
              {productionAssets}
            </Text>
          </Paper>

          <Paper p="sm" radius="lg" className="dashboard-panel-soft dashboard-focus-signal" withBorder>
            <Group gap={8} wrap="nowrap">
              <IconLayersIntersect size={15} />
              <Text size="xs" tt="uppercase" fw={700} c="dimmed" style={{ letterSpacing: '0.08em' }}>
                Dominant surface
              </Text>
            </Group>
            <Text mt={6} size="lg" fw={800}>
              {dominantSurface}
            </Text>
          </Paper>
        </SimpleGrid>
      </Stack>
    </Paper>
  );
}
