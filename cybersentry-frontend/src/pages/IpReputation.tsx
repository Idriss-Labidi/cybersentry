import { useState } from 'react';
import {
  Container,
  Title,
  Text,
  TextInput,
  Button,
  Paper,
  Stack,
  Group,
  LoadingOverlay,
  Alert,
  Badge,
  Divider,
  Table,
  RingProgress,
  Progress,
  Center,
  ThemeIcon,
  SimpleGrid,
  Box,
} from '@mantine/core';
import {
  IconSearch,
  IconAlertCircle,
  IconMapPin,
  IconShieldCheck,
  IconNetwork,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { ipReputation, type IpReputationResponse } from '../services/ip-tools';

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
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.ip_address?.[0] ||
        'An error occurred while checking IP reputation.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <div>
          <Group gap="xs" mb={4}>
            <IconShieldCheck size={28} />
            <Title order={2}>IP Reputation & Geolocation</Title>
          </Group>
          <Text c="dimmed" fz="sm">
            Check the reputation, risk score, and geographic location of any IP address.
          </Text>
        </div>

        <Paper withBorder p="lg" radius="md" pos="relative">
          <LoadingOverlay visible={loading} />
          <Group align="end">
            <TextInput
              label="IP Address"
              placeholder="8.8.8.8"
              value={ip}
              onChange={(e) => setIp(e.currentTarget.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
              size="md"
              style={{ flex: 1 }}
            />
            <Button
              leftSection={<IconSearch size={18} />}
              onClick={handleCheck}
              disabled={!ip.trim()}
              size="md"
            >
              Check
            </Button>
          </Group>
        </Paper>

        {error && (
          <Alert icon={<IconAlertCircle size={18} />} color="red" title="Error" variant="light">
            {error}
          </Alert>
        )}

        {result && (
          <Stack gap="lg">
            {/* Reputation Score Card */}
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
                  <Progress
                    value={result.score}
                    color={riskColor(result.risk_level)}
                    size="sm"
                    mt="xs"
                    w={200}
                  />
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
                {result.is_proxy && (
                  <Badge variant="filled" color="red" size="sm">
                    Proxy / VPN
                  </Badge>
                )}
                {result.is_hosting && (
                  <Badge variant="filled" color="orange" size="sm">
                    Hosting
                  </Badge>
                )}
                {result.is_mobile && (
                  <Badge variant="filled" color="blue" size="sm">
                    Mobile
                  </Badge>
                )}
              </Group>
            </Paper>

            {/* Risk Factors */}
            {result.risk_factors.length > 0 && (
              <Paper withBorder p="lg" radius="md">
                <Group gap="xs" mb="md">
                  <ThemeIcon variant="light" color="orange" size="md">
                    <IconAlertTriangle size={16} />
                  </ThemeIcon>
                  <Title order={4}>Risk Factors</Title>
                </Group>
                <Stack gap="xs">
                  {result.risk_factors.map((factor, i) => (
                    <Group key={i} gap="xs">
                      <Box w={6} h={6} style={{ borderRadius: '50%', background: 'var(--mantine-color-orange-6)' }} />
                      <Text fz="sm">{factor}</Text>
                    </Group>
                  ))}
                </Stack>
              </Paper>
            )}

            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              {/* Geolocation */}
              <Paper withBorder p="lg" radius="md">
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
                      ['Country', `${result.geolocation.country || '—'} ${result.geolocation.country_code ? `(${result.geolocation.country_code})` : ''}`],
                      ['Region', result.geolocation.region],
                      ['City', result.geolocation.city],
                      ['ZIP', result.geolocation.zip],
                      ['Latitude', result.geolocation.latitude],
                      ['Longitude', result.geolocation.longitude],
                      ['Timezone', result.geolocation.timezone],
                    ].map(([label, value]) => (
                      <Table.Tr key={label as string}>
                        <Table.Td w={100}>
                          <Text fz="sm" fw={500}>{label as string}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text fz="sm" ff="monospace">{value ?? '—'}</Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Paper>

              {/* Network */}
              <Paper withBorder p="lg" radius="md">
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
                        <Table.Td w={120}>
                          <Text fz="sm" fw={500}>{label as string}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text fz="sm" ff="monospace">{value ?? '—'}</Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Paper>
            </SimpleGrid>
          </Stack>
        )}
      </Stack>
    </Container>
  );
};
