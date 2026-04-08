import type { ReactNode } from 'react';
import {
  Badge,
  Group,
  HoverCard,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  UnstyledButton,
} from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';

export type GuidanceItem = {
  label: string;
  title: string;
  description: string;
  bullets?: string[];
  badge?: string;
  icon?: ReactNode;
};

type GuidanceHoverCardProps = {
  item: GuidanceItem;
};

export function GuidanceHoverCard({ item }: GuidanceHoverCardProps) {
  return (
    <HoverCard width={320} shadow="md" openDelay={120} closeDelay={80} radius="lg" withArrow>
      <HoverCard.Target>
        <UnstyledButton>
          <Group
            gap={8}
            px="sm"
            py={6}
            style={{
              borderRadius: 999,
              border: '1px solid var(--app-border)',
              background: 'var(--app-surface-soft)',
            }}
          >
            <ThemeIcon size="sm" radius="xl" variant="light" color="brand">
              {item.icon ?? <IconInfoCircle size={14} />}
            </ThemeIcon>
            <Text size="sm" fw={600}>
              {item.label}
            </Text>
          </Group>
        </UnstyledButton>
      </HoverCard.Target>

      <HoverCard.Dropdown p={0} style={{ background: 'transparent', border: 'none' }}>
        <Paper p="md" radius="lg" withBorder>
          <Stack gap="sm">
            <Group justify="space-between" align="flex-start">
              <Text fw={800}>{item.title}</Text>
              {item.badge ? (
                <Badge variant="light" color="brand">
                  {item.badge}
                </Badge>
              ) : null}
            </Group>
            <Text size="sm" c="dimmed">
              {item.description}
            </Text>
            {item.bullets && item.bullets.length > 0 ? (
              <Stack gap={8}>
                {item.bullets.map((bullet) => (
                  <Group key={bullet} wrap="nowrap" align="flex-start" gap="xs">
                    <div
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: 999,
                        marginTop: 7,
                        flexShrink: 0,
                        background: 'var(--app-accent)',
                      }}
                    />
                    <Text size="sm">{bullet}</Text>
                  </Group>
                ))}
              </Stack>
            ) : null}
          </Stack>
        </Paper>
      </HoverCard.Dropdown>
    </HoverCard>
  );
}

type GuidanceGroupProps = {
  items: GuidanceItem[];
};

export function GuidanceGroup({ items }: GuidanceGroupProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Group gap="xs" mt="md" wrap="wrap">
      {items.map((item) => (
        <GuidanceHoverCard key={`${item.label}-${item.title}`} item={item} />
      ))}
    </Group>
  );
}
