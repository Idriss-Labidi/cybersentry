import { Badge, Box, Button, Center, Group, Modal, Paper, RingProgress, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { IconExternalLink, IconShield } from '@tabler/icons-react';
import type { Asset, AssetPayload } from '../../services/assets';
import type { IPReputationScanHistory } from '../../services/ip-tools';
import { formatScanDate, riskColor } from '../../utils/ip-intelligence';

type IpScanDetailsModalProps = {
  opened: boolean;
  scan: IPReputationScanHistory | null;
  linkedAsset: Asset | null;
  assetDefaults: AssetPayload | null;
  assetLookupLoading: boolean;
  onOpenLinkedAsset: (asset: Asset) => void;
  onSaveAsAsset: () => void;
  onClose: () => void;
};

export default function IpScanDetailsModal({
  opened,
  scan,
  linkedAsset,
  assetDefaults,
  assetLookupLoading,
  onOpenLinkedAsset,
  onSaveAsAsset,
  onClose,
}: IpScanDetailsModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title={`IP Reputation Details - ${scan?.ip_address}`} size="xl">
      {scan ? (
        <Stack gap="lg">
          <Group gap="sm">
            {linkedAsset ? (
              <Button
                variant="light"
                onClick={() => onOpenLinkedAsset(linkedAsset)}
                leftSection={<IconExternalLink size={16} />}
              >
                Open linked asset
              </Button>
            ) : assetDefaults ? (
              <Button variant="light" onClick={onSaveAsAsset} leftSection={<IconShield size={16} />}>
                Save as asset
              </Button>
            ) : null}
            {assetLookupLoading ? (
              <Text size="sm" c="dimmed">
                Checking asset inventory link...
              </Text>
            ) : null}
          </Group>

          <Paper withBorder p="lg" radius="md">
            <Group justify="space-between" align="center">
              <div>
                <Text fz="sm" c="dimmed" fw={500}>
                  Reputation Score
                </Text>
                <Group gap="xs" align="baseline">
                  <Title order={1}>{scan.reputation_score}</Title>
                  <Text c="dimmed" fz="sm">
                    / 100
                  </Text>
                </Group>
              </div>
              <Center>
                <RingProgress
                  size={80}
                  thickness={8}
                  roundCaps
                  sections={[{ value: scan.reputation_score, color: riskColor(scan.risk_level) }]}
                  label={
                    <Text ta="center" fw={700} fz="md" tt="uppercase">
                      {scan.risk_level}
                    </Text>
                  }
                />
              </Center>
            </Group>
          </Paper>

          {scan.risk_factors.length > 0 ? (
            <Paper withBorder p="lg" radius="md">
              <Title order={5} mb="md">
                Risk Factors
              </Title>
              <Stack gap="xs">
                {scan.risk_factors.map((factor) => (
                  <Group key={factor} gap="xs">
                    <Box
                      w={6}
                      h={6}
                      style={{ borderRadius: '50%', background: 'var(--mantine-color-orange-6)' }}
                    />
                    <Text fz="sm">{factor}</Text>
                  </Group>
                ))}
              </Stack>
            </Paper>
          ) : null}

          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <Paper withBorder p="lg" radius="md">
              <Title order={5} mb="md">
                Geolocation
              </Title>
              <Stack gap="xs" fz="sm">
                <Group justify="space-between">
                  <Text c="dimmed">Country:</Text>
                  <Text fw={500}>{scan.geolocation?.country || 'N/A'}</Text>
                </Group>
                <Group justify="space-between">
                  <Text c="dimmed">Region:</Text>
                  <Text fw={500}>{scan.geolocation?.region || 'N/A'}</Text>
                </Group>
                <Group justify="space-between">
                  <Text c="dimmed">City:</Text>
                  <Text fw={500}>{scan.geolocation?.city || 'N/A'}</Text>
                </Group>
                <Group justify="space-between">
                  <Text c="dimmed">Timezone:</Text>
                  <Text fw={500}>{scan.geolocation?.timezone || 'N/A'}</Text>
                </Group>
              </Stack>
            </Paper>

            <Paper withBorder p="lg" radius="md">
              <Title order={5} mb="md">
                Network Information
              </Title>
              <Stack gap="xs" fz="sm">
                <Group justify="space-between">
                  <Text c="dimmed">ISP:</Text>
                  <Text fw={500}>{scan.network?.isp || 'N/A'}</Text>
                </Group>
                <Group justify="space-between">
                  <Text c="dimmed">Organization:</Text>
                  <Text fw={500}>{scan.network?.org || 'N/A'}</Text>
                </Group>
                <Group justify="space-between">
                  <Text c="dimmed">AS Name:</Text>
                  <Text fw={500}>{scan.network?.as_name || 'N/A'}</Text>
                </Group>
              </Stack>
            </Paper>
          </SimpleGrid>

          <Paper withBorder p="lg" radius="md">
            <Title order={5} mb="md">
              IP Flags
            </Title>
            <Group>
              {scan.is_proxy ? (
                <Badge variant="filled" color="red">
                  Proxy / VPN
                </Badge>
              ) : null}
              {scan.is_hosting ? (
                <Badge variant="filled" color="orange">
                  Hosting
                </Badge>
              ) : null}
              {scan.is_mobile ? (
                <Badge variant="filled" color="blue">
                  Mobile
                </Badge>
              ) : null}
              {!scan.is_proxy && !scan.is_hosting && !scan.is_mobile ? (
                <Badge variant="light" color="green">
                  No Flags
                </Badge>
              ) : null}
            </Group>
          </Paper>

          <Paper withBorder p="lg" radius="md">
            <Text fz="sm" c="dimmed">
              Scanned at: {formatScanDate(scan.scanned_at)}
            </Text>
          </Paper>
        </Stack>
      ) : null}
    </Modal>
  );
}
