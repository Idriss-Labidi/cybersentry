import { Group, Stack, Text, ThemeIcon } from '@mantine/core';
import cybersentryLogo from '../../Cybersentry-logo.png';

type BrandMarkProps = {
  compact?: boolean;
};

export default function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <Group gap="sm" wrap="nowrap">
      <ThemeIcon
        size={compact ? 46 : 52}
        radius="xl"
        variant="transparent"
        style={{
          border: '2px solid var(--mantine-color-brand-6)',
          backgroundColor: 'transparent',
        }}
      >
        <img
          src={cybersentryLogo}
          alt=""
          aria-hidden="true"
          style={{
            width: compact ? 28 : 32,
            height: compact ? 28 : 32,
            objectFit: 'contain',
          }}
        />
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
