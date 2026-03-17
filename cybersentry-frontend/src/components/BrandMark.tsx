import { Group, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconShieldCheck } from '@tabler/icons-react';

type BrandMarkProps = {
  compact?: boolean;
};

export default function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <Group gap="sm" wrap="nowrap">
      <ThemeIcon
        size={compact ? 40 : 46}
        radius="xl"
        variant="gradient"
        gradient={{ from: 'brand.6', to: 'brand.3', deg: 135 }}
        style={{
          boxShadow: '0 12px 28px rgba(22, 193, 160, 0.22)',
        }}
      >
        <IconShieldCheck size={compact ? 20 : 24} />
      </ThemeIcon>

      <Stack gap={0}>
        <Text
          fw={800}
          size={compact ? 'md' : 'lg'}
          style={{ letterSpacing: '-0.04em', lineHeight: 1 }}
        >
          CyberSentry
        </Text>
        {!compact && (
          <Text size="xs" c="dimmed" tt="uppercase" fw={700} style={{ letterSpacing: '0.12em' }}>
            Threat visibility platform
          </Text>
        )}
      </Stack>
    </Group>
  );
}
