import {
  Badge,
  Box,
  Button,
  Center,
  Divider,
  Group,
  Paper,
  Progress,
  RingProgress,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconExternalLink,
  IconMapPin,
  IconNetwork,
  IconShieldCheck,
} from '@tabler/icons-react';
import type { Asset } from '../../services/assets';
import type { IpReputationResponse } from '../../services/ip-tools';
import { riskColor } from '../../utils/ip-intelligence';

type IpScanResultProps = {
  result: IpReputationResponse;
  linkedAsset: Asset | null;
  canSaveAsAsset: boolean;
  assetLookupLoading: boolean;
  onOpenLinkedAsset: (asset: Asset) => void;
  onSaveAsAsset: () => void;
};

export default function IpScanResult({
  result,
  linkedAsset,
  canSaveAsAsset,
  assetLookupLoading,
  onOpenLinkedAsset,
  onSaveAsAsset,
}: IpScanResultProps) {
  return (
    <Stack gap="lg">
      <Paper withBorder p="lg" radius="md">
        <Group justify="space-between" align="center">
          <div>
            <Text fz="sm" c="dimmed" fw={500}>
              Reputation Score
            </Text>
            <Group gap="xs" align="baseline">
              <Title order={1}>{result.score}</Title>
              <Text c="dimmed" fz="sm">
                / 100
              </Text>
            </Group>
            <Progress value={result.score} color={riskColor(result.risk_level)} size="sm" mt="xs" w={200} />
          </div>
          <Center>
            <RingProgress
              size={100}
              thickness={10}
              roundCaps
              sections={[{ value: result.score, color: riskColor(result.risk_level) }]}
              label={
                <Text ta="center" fw={700} fz="lg" tt="uppercase">
                  {result.risk_level}
                </Text>
              }
            />
          </Center>
        </Group>
        <Divider my="md" />
        <Group gap="sm">
          <Badge variant="light" size="lg">
            {result.ip}
          </Badge>
          <Badge variant="light" color={riskColor(result.risk_level)} size="lg">
            Risk: {result.risk_level}
          </Badge>
          {result.is_proxy ? (
            <Badge variant="filled" color="red" size="sm">
              Proxy / VPN
            </Badge>
          ) : null}
          {result.is_hosting ? (
            <Badge variant="filled" color="orange" size="sm">
              Hosting
            </Badge>
          ) : null}
          {result.is_mobile ? (
            <Badge variant="filled" color="blue" size="sm">
              Mobile
            </Badge>
          ) : null}
        </Group>
        <Group gap="sm" mt="md">
          {linkedAsset ? (
            <Button
              variant="light"
              onClick={() => onOpenLinkedAsset(linkedAsset)}
              leftSection={<IconExternalLink size={16} />}
            >
              Open linked asset
            </Button>
          ) : canSaveAsAsset ? (
            <Button variant="light" onClick={onSaveAsAsset} leftSection={<IconShieldCheck size={16} />}>
              Save as asset
            </Button>
          ) : null}
          {assetLookupLoading ? (
            <Text size="sm" c="dimmed">
              Checking asset inventory link...
            </Text>
          ) : null}
        </Group>
      </Paper>

      {result.risk_factors.length > 0 ? (
        <Paper withBorder p="lg" radius="md">
          <Group gap="xs" mb="md">
            <ThemeIcon variant="light" color="orange" size="md">
              <IconAlertTriangle size={16} />
            </ThemeIcon>
            <Title order={4}>Risk Factors</Title>
          </Group>
          <Stack gap="xs">
            {result.risk_factors.map((factor) => (
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
          <Group gap="xs" mb="md">
            <ThemeIcon variant="light" color="blue" size="md">
              <IconMapPin size={16} />
            </ThemeIcon>
            <Title order={4}>Geolocation</Title>
          </Group>
          <Stack gap="xs" fz="sm">
            <Group justify="space-between">
              <Text c="dimmed">Country:</Text>
              <Text fw={500}>{result.geolocation?.country || 'N/A'}</Text>
            </Group>
            <Group justify="space-between">
              <Text c="dimmed">Region:</Text>
              <Text fw={500}>{result.geolocation?.region || 'N/A'}</Text>
            </Group>
            <Group justify="space-between">
              <Text c="dimmed">City:</Text>
              <Text fw={500}>{result.geolocation?.city || 'N/A'}</Text>
            </Group>
            <Group justify="space-between">
              <Text c="dimmed">Timezone:</Text>
              <Text fw={500}>{result.geolocation?.timezone || 'N/A'}</Text>
            </Group>
          </Stack>
        </Paper>

        <Paper withBorder p="lg" radius="md">
          <Group gap="xs" mb="md">
            <ThemeIcon variant="light" color="green" size="md">
              <IconNetwork size={16} />
            </ThemeIcon>
            <Title order={4}>Network Information</Title>
          </Group>
          <Stack gap="xs" fz="sm">
            <Group justify="space-between">
              <Text c="dimmed">ISP:</Text>
              <Text fw={500}>{result.network?.isp || 'N/A'}</Text>
            </Group>
            <Group justify="space-between">
              <Text c="dimmed">Organization:</Text>
              <Text fw={500}>{result.network?.org || 'N/A'}</Text>
            </Group>
            <Group justify="space-between">
              <Text c="dimmed">AS Name:</Text>
              <Text fw={500}>{result.network?.as_name || 'N/A'}</Text>
            </Group>
            <Group justify="space-between">
              <Text c="dimmed">Reverse DNS:</Text>
              <Text fw={500} style={{ wordBreak: 'break-all' }}>
                {result.network?.reverse_dns || 'N/A'}
              </Text>
            </Group>
          </Stack>
        </Paper>
      </SimpleGrid>
    </Stack>
  );
}
