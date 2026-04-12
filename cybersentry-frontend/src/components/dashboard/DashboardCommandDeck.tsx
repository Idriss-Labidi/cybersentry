import { Button, Group, Paper, SimpleGrid, Stack, Text, ThemeIcon } from '@mantine/core';
import {
  IconAlertTriangle,
  IconArrowRight,
  IconBolt,
  IconBrowser,
  IconBrandGithub,
  IconBellRinging,
  IconFlag3,
  IconRadar2,
  IconWorldWww,
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';

type DashboardCommandDeckProps = {
  criticalIncidents: number;
  unreadAlerts: number;
  criticalAlerts: number;
  uncoveredAssets: number;
  className?: string;
};

const primaryActions = [
  { label: 'Open alerts', to: '/dashboard/alerts' },
  { label: 'Inspect incidents', to: '/dashboard/incidents' },
  { label: 'Analytics', to: '/dashboard/analytics' },
];

const intelligenceActions = [
  { label: 'DNS', to: '/dashboard/dns-intelligence', icon: IconWorldWww },
  { label: 'IP', to: '/dashboard/ip-intelligence', icon: IconRadar2 },
  { label: 'GitHub', to: '/dashboard/github', icon: IconBrandGithub },
  { label: 'Websites', to: '/dashboard/assets', icon: IconBrowser },
];

export function DashboardCommandDeck({
  criticalIncidents,
  unreadAlerts,
  criticalAlerts,
  uncoveredAssets,
  className,
}: DashboardCommandDeckProps) {
  return (
    <Paper p="xl" radius="xl" className={`dashboard-panel ${className ?? ''}`.trim()}>
      <Stack gap="lg" h="100%">
        <Group gap="sm">
          <ThemeIcon size={48} radius="xl" variant="light" color="brand">
            <IconBolt size={22} />
          </ThemeIcon>
          <div>
            <Text size="xs" tt="uppercase" fw={800} c="dimmed" style={{ letterSpacing: '0.08em' }}>
              Command Deck
            </Text>
            <Text fw={900} size="xl">
              Immediate operator levers
            </Text>
          </div>
        </Group>

        <SimpleGrid cols={2} spacing="sm">
          <Paper p="sm" radius="lg" className="dashboard-panel-soft" withBorder>
            <Group gap="xs" mb={6}>
              <IconFlag3 size={16} />
              <Text size="xs" tt="uppercase" fw={700} c="dimmed" style={{ letterSpacing: '0.08em' }}>
                Incidents
              </Text>
            </Group>
            <Text size="xl" fw={900} c={criticalIncidents > 0 ? 'red' : undefined}>
              {criticalIncidents}
            </Text>
          </Paper>

          <Paper p="sm" radius="lg" className="dashboard-panel-soft" withBorder>
            <Group gap="xs" mb={6}>
              <IconAlertTriangle size={16} />
              <Text size="xs" tt="uppercase" fw={700} c="dimmed" style={{ letterSpacing: '0.08em' }}>
                Open alerts
              </Text>
            </Group>
            <Text size="xl" fw={900} c={unreadAlerts > 0 ? 'yellow' : undefined}>
              {unreadAlerts}
            </Text>
          </Paper>

          <Paper p="sm" radius="lg" className="dashboard-panel-soft" withBorder>
            <Group gap="xs" mb={6}>
              <IconRadar2 size={16} />
              <Text size="xs" tt="uppercase" fw={700} c="dimmed" style={{ letterSpacing: '0.08em' }}>
                Visibility gaps
              </Text>
            </Group>
            <Text size="xl" fw={900} c={uncoveredAssets > 0 ? 'orange' : undefined}>
              {uncoveredAssets}
            </Text>
          </Paper>

          <Paper p="sm" radius="lg" className="dashboard-panel-soft" withBorder>
            <Group gap="xs" mb={6}>
              <IconBellRinging size={16} />
              <Text size="xs" tt="uppercase" fw={700} c="dimmed" style={{ letterSpacing: '0.08em' }}>
                Critical alerts
              </Text>
            </Group>
            <Text size="xl" fw={900} c={criticalAlerts > 0 ? 'red' : undefined}>
              {criticalAlerts}
            </Text>
          </Paper>
        </SimpleGrid>

        <Text size="sm" c="dimmed" className="dashboard-command-note">
          Jump straight to inventory, response, or deeper intelligence without leaving the cockpit.
        </Text>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
          {primaryActions.map((action) => (
            <Button
              key={action.to}
              component={Link}
              to={action.to}
              variant="light"
              rightSection={<IconArrowRight size={16} />}
              fullWidth
              className="dashboard-command-button"
            >
              {action.label}
            </Button>
          ))}
        </SimpleGrid>

        <Stack gap="xs">
          <Text size="xs" tt="uppercase" fw={700} c="dimmed" style={{ letterSpacing: '0.08em' }}>
            Intelligence hubs
          </Text>
          <SimpleGrid cols={2} spacing="sm">
            {intelligenceActions.map((action) => (
              <Button
                key={action.to}
                component={Link}
                to={action.to}
                variant="default"
                radius="xl"
                leftSection={<action.icon size={15} />}
                className="dashboard-intelligence-button"
                fullWidth
              >
                {action.label}
              </Button>
            ))}
          </SimpleGrid>
        </Stack>
      </Stack>
    </Paper>
  );
}
