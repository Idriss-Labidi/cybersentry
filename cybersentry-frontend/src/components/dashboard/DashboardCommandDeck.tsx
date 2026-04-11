import { Button, Group, Paper, SimpleGrid, Stack, Text, ThemeIcon } from '@mantine/core';
import {
  IconAlertTriangle,
  IconArrowRight,
  IconBolt,
  IconBrandGithub,
  IconFlag3,
  IconPackages,
  IconRadar2,
  IconShieldCheck,
  IconWorldWww,
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';

type DashboardCommandDeckProps = {
  criticalIncidents: number;
  breachedIncidents: number;
  unreadAlerts: number;
  criticalAlerts: number;
  uncoveredAssets: number;
  mostExposedSurface: string;
  className?: string;
};

const primaryActions = [
  { label: 'Review assets', to: '/dashboard/assets' },
  { label: 'Open alerts', to: '/dashboard/alerts' },
  { label: 'Inspect incidents', to: '/dashboard/incidents' },
];

const intelligenceActions = [
  { label: 'DNS', to: '/dashboard/dns-intelligence', icon: IconWorldWww },
  { label: 'IP', to: '/dashboard/ip-intelligence', icon: IconRadar2 },
  { label: 'GitHub', to: '/dashboard/github', icon: IconBrandGithub },
  { label: 'Websites', to: '/dashboard/assets?type=website', icon: IconShieldCheck },
];

export function DashboardCommandDeck({
  criticalIncidents,
  breachedIncidents,
  unreadAlerts,
  criticalAlerts,
  uncoveredAssets,
  mostExposedSurface,
  className,
}: DashboardCommandDeckProps) {
  return (
    <Paper p="xl" radius="xl" className={`dashboard-panel ${className ?? ''}`.trim()}>
      <Stack gap="lg">
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
                Critical incidents
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
                Unread alerts
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
                Coverage gaps
              </Text>
            </Group>
            <Text size="xl" fw={900} c={uncoveredAssets > 0 ? 'orange' : undefined}>
              {uncoveredAssets}
            </Text>
          </Paper>

          <Paper p="sm" radius="lg" className="dashboard-panel-soft" withBorder>
            <Group gap="xs" mb={6}>
              <IconPackages size={16} />
              <Text size="xs" tt="uppercase" fw={700} c="dimmed" style={{ letterSpacing: '0.08em' }}>
                Exposed surface
              </Text>
            </Group>
            <Text size="lg" fw={900}>
              {mostExposedSurface}
            </Text>
          </Paper>
        </SimpleGrid>

        <Stack gap="xs">
          <Text size="sm" c="dimmed">
            {breachedIncidents > 0
              ? `${breachedIncidents} incident${breachedIncidents > 1 ? 's are' : ' is'} already breaching SLA expectations.`
              : 'No active SLA breaches detected right now.'}
          </Text>
          <Text size="sm" c="dimmed">
            {criticalAlerts > 0
              ? `${criticalAlerts} critical alert${criticalAlerts > 1 ? 's are' : ' is'} waiting in the notification pipeline.`
              : 'No critical alert cluster is building at the moment.'}
          </Text>
        </Stack>

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
          <SimpleGrid cols={{ base: 2, sm: 2 }} spacing="sm">
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
