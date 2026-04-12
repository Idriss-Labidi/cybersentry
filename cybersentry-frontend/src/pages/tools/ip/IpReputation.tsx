import { useState } from 'react';
import {
  Alert,
  Badge,
  Box,
  Button,
  Center,
  Group,
  LoadingOverlay,
  Paper,
  Progress,
  RingProgress,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconMapPin,
  IconNetwork,
  IconSearch,
  IconShieldCheck,
} from '@tabler/icons-react';
import ToolPageLayout from '../../../layouts/tools/ToolPageLayout';
import { ipReputation, type IpReputationResponse } from '../../../services/ip-tools';
import { getApiErrorMessage } from '../../../utils/api-error';

const riskColor = (level: string) => {
  switch (level) {
    case 'low':
      return 'green';
    case 'medium':
      return 'yellow';
    case 'high':
      return 'red';
    default:
      return 'gray';
  }
};

export const IpReputation = () => {
  const [ip, setIp] = useState('');
  const [result, setResult] = useState<IpReputationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async () => {
    if (!ip.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await ipReputation({ ip_address: ip.trim() });
      setResult(response.data);
    } catch (error: unknown) {
      const message = getApiErrorMessage(
        error,
        ['ip_address'],
        'An error occurred while checking IP reputation.'
      );
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolPageLayout
      icon={<IconShieldCheck size={26} />}
      eyebrow="Public tool"
      title="IP reputation and geolocation"
      description="Review risk score, network context, and geographic metadata for any IP from a more structured investigation surface."
      workflow={[
        'Submit the IP address you need to assess.',
        'Review risk score and flags first, then inspect geolocation and network context.',
        'Use high-risk output to guide deeper triage or escalation.',
      ]}
      notes={[
        'Mobile, proxy, and hosting flags help explain why a reputation score may be elevated.',
        'Pair this page with reverse IP lookup when a risky address hosts multiple domains.',
      ]}
      examples={['8.8.8.8', '1.1.1.1', '185.199.108.153']}
    >
      <Paper p="lg" radius="xl" pos="relative">
        <LoadingOverlay visible={loading} />
        <Group align="end">
          <TextInput
            label="IP Address"
            placeholder="8.8.8.8"
            value={ip}
            onChange={(event) => setIp(event.currentTarget.value)}
            onKeyDown={(event) => event.key === 'Enter' && handleCheck()}
            style={{ flex: 1 }}
          />
          <Button leftSection={<IconSearch size={18} />} onClick={handleCheck} disabled={!ip.trim()}>
            Check reputation
          </Button>
        </Group>
      </Paper>

      {error ? (
        <Alert icon={<IconAlertCircle size={18} />} color="red" title="Error" variant="light">
          {error}
        </Alert>
      ) : null}

      {result ? (
        <Stack gap="lg">
          <Paper p="lg" radius="xl">
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
                <Progress value={result.score} color={riskColor(result.risk_level)} size="sm" mt="xs" w={220} />
              </div>
              <Center>
                <RingProgress
                  size={110}
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
            <Group gap="sm" mt="md">
              <Badge size="lg">{result.ip}</Badge>
              <Badge color={riskColor(result.risk_level)} size="lg">
                Risk: {result.risk_level}
              </Badge>
              {result.is_proxy ? <Badge color="red">Proxy / VPN</Badge> : null}
              {result.is_hosting ? <Badge color="orange">Hosting</Badge> : null}
              {result.is_mobile ? <Badge color="blue">Mobile</Badge> : null}
            </Group>
          </Paper>

          {result.risk_factors.length > 0 ? (
            <Paper p="lg" radius="xl">
              <Group gap="xs" mb="md">
                <ThemeIcon variant="light" color="orange" size="md">
                  <IconAlertTriangle size={16} />
                </ThemeIcon>
                <Title order={4}>Risk factors</Title>
              </Group>
              <Stack gap="xs">
                {result.risk_factors.map((factor, index) => (
                  <Group key={index} gap="xs">
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

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
            <Paper p="lg" radius="xl">
              <Group gap="xs" mb="md">
                <ThemeIcon variant="light" color="blue" size="md">
                  <IconMapPin size={16} />
                </ThemeIcon>
                <Title order={4}>Geolocation</Title>
              </Group>
              <Table withTableBorder>
                <Table.Tbody>
                  {[
                    ['Continent', result.geolocation.continent],
                    ['Country', `${result.geolocation.country || '--'} ${result.geolocation.country_code ? `(${result.geolocation.country_code})` : ''}`],
                    ['Region', result.geolocation.region],
                    ['City', result.geolocation.city],
                    ['ZIP', result.geolocation.zip],
                    ['Latitude', result.geolocation.latitude],
                    ['Longitude', result.geolocation.longitude],
                    ['Timezone', result.geolocation.timezone],
                  ].map(([label, value]) => (
                    <Table.Tr key={label as string}>
                      <Table.Td w={120}>
                        <Text fz="sm" fw={600}>
                          {label as string}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text fz="sm" ff="monospace">
                          {value ?? '--'}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>

            <Paper p="lg" radius="xl">
              <Group gap="xs" mb="md">
                <ThemeIcon variant="light" color="violet" size="md">
                  <IconNetwork size={16} />
                </ThemeIcon>
                <Title order={4}>Network</Title>
              </Group>
              <Table withTableBorder>
                <Table.Tbody>
                  {[
                    ['ISP', result.network.isp],
                    ['Organization', result.network.org],
                    ['AS Number', result.network.as_number],
                    ['AS Name', result.network.as_name],
                    ['Reverse DNS', result.network.reverse_dns],
                  ].map(([label, value]) => (
                    <Table.Tr key={label as string}>
                      <Table.Td w={140}>
                        <Text fz="sm" fw={600}>
                          {label as string}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text fz="sm" ff="monospace">
                          {value ?? '--'}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
          </SimpleGrid>
        </Stack>
      ) : null}
    </ToolPageLayout>
  );
};
