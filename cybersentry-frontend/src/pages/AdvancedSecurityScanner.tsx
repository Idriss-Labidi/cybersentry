import { useState, useEffect } from 'react';
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
  ScrollArea,
  Modal,
} from '@mantine/core';
import {
  IconSearch,
  IconAlertCircle,
  IconMapPin,
  IconShieldCheck,
  IconNetwork,
  IconAlertTriangle,
  IconHistory,
  IconEye,
} from '@tabler/icons-react';
import {
  advancedIpReputation,
  getScanHistory,
  type IpReputationResponse,
  type IPReputationScanHistory,
} from '../services/ip-tools';

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

export const AdvancedSecurityScanner = () => {
  const [ipInput, setIpInput] = useState('');
  const [ipResult, setIpResult] = useState<IpReputationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [scans, setScans] = useState<IPReputationScanHistory[]>([]);
  const [selectedScan, setSelectedScan] = useState<IPReputationScanHistory | null>(null);
  const [detailsModalOpened, setDetailsModalOpened] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await getScanHistory();
      setScans(response.data.ip_scans);
    } catch (err: any) {
      console.error('Failed to load history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleIpCheck = async () => {
    if (!ipInput.trim()) return;

    setLoading(true);
    setError(null);
    setIpResult(null);

    try {
      const response = await advancedIpReputation({ ip_address: ipInput.trim() });
      setIpResult(response.data);
      // Reload history after a new scan
      loadHistory();
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleViewDetails = (scan: IPReputationScanHistory) => {
    setSelectedScan(scan);
    setDetailsModalOpened(true);
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <div>
          <Group gap="xs" mb={4}>
            <IconShieldCheck size={28} />
            <Title order={2}>Advanced IP Reputation Scanner</Title>
          </Group>
          <Text c="dimmed" fz="sm">
            Perform advanced IP reputation checks and view your scan history.
          </Text>
        </div>

        {/* IP Reputation Check Section */}
        <Paper withBorder p="lg" radius="md" pos="relative">
          <LoadingOverlay visible={loading} />
          <Group align="end">
            <TextInput
              label="IP Address"
              placeholder="8.8.8.8"
              value={ipInput}
              onChange={(e) => setIpInput(e.currentTarget.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleIpCheck()}
              size="md"
              style={{ flex: 1 }}
            />
            <Button
              leftSection={<IconSearch size={18} />}
              onClick={handleIpCheck}
              disabled={!ipInput.trim()}
              size="md"
            >
              Check Reputation
            </Button>
          </Group>
        </Paper>

        {error && (
          <Alert icon={<IconAlertCircle size={18} />} color="red" title="Error" variant="light">
            {error}
          </Alert>
        )}

        {ipResult && (
          <Stack gap="lg">
            {/* Reputation Score Card */}
            <Paper withBorder p="lg" radius="md">
              <Group justify="space-between" align="center">
                <div>
                  <Text fz="sm" c="dimmed" fw={500}>
                    Reputation Score
                  </Text>
                  <Group gap="xs" align="baseline">
                    <Title order={1}>{ipResult.score}</Title>
                    <Text c="dimmed" fz="sm">
                      / 100
                    </Text>
                  </Group>
                  <Progress
                    value={ipResult.score}
                    color={riskColor(ipResult.risk_level)}
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
                    sections={[{ value: ipResult.score, color: riskColor(ipResult.risk_level) }]}
                    label={
                      <Text ta="center" fw={700} fz="lg" tt="uppercase">
                        {ipResult.risk_level}
                      </Text>
                    }
                  />
                </Center>
              </Group>
              <Divider my="md" />
              <Group gap="sm">
                <Badge variant="light" size="lg">
                  {ipResult.ip}
                </Badge>
                <Badge variant="light" color={riskColor(ipResult.risk_level)} size="lg">
                  Risk: {ipResult.risk_level}
                </Badge>
                {ipResult.is_proxy && (
                  <Badge variant="filled" color="red" size="sm">
                    Proxy / VPN
                  </Badge>
                )}
                {ipResult.is_hosting && (
                  <Badge variant="filled" color="orange" size="sm">
                    Hosting
                  </Badge>
                )}
                {ipResult.is_mobile && (
                  <Badge variant="filled" color="blue" size="sm">
                    Mobile
                  </Badge>
                )}
              </Group>
            </Paper>

            {/* Risk Factors */}
            {ipResult.risk_factors.length > 0 && (
              <Paper withBorder p="lg" radius="md">
                <Group gap="xs" mb="md">
                  <ThemeIcon variant="light" color="orange" size="md">
                    <IconAlertTriangle size={16} />
                  </ThemeIcon>
                  <Title order={4}>Risk Factors</Title>
                </Group>
                <Stack gap="xs">
                  {ipResult.risk_factors.map((factor, i) => (
                    <Group key={i} gap="xs">
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
                <Stack gap="xs" fz="sm">
                  <Group justify="space-between">
                    <Text c="dimmed">Country:</Text>
                    <Text fw={500}>{ipResult.geolocation?.country || 'N/A'}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text c="dimmed">Region:</Text>
                    <Text fw={500}>{ipResult.geolocation?.region || 'N/A'}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text c="dimmed">City:</Text>
                    <Text fw={500}>{ipResult.geolocation?.city || 'N/A'}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text c="dimmed">Timezone:</Text>
                    <Text fw={500}>{ipResult.geolocation?.timezone || 'N/A'}</Text>
                  </Group>
                </Stack>
              </Paper>

              {/* Network Information */}
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
                    <Text fw={500}>{ipResult.network?.isp || 'N/A'}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text c="dimmed">Organization:</Text>
                    <Text fw={500}>{ipResult.network?.org || 'N/A'}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text c="dimmed">AS Name:</Text>
                    <Text fw={500}>{ipResult.network?.as_name || 'N/A'}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text c="dimmed">Reverse DNS:</Text>
                    <Text fw={500} style={{ wordBreak: 'break-all' }}>
                      {ipResult.network?.reverse_dns || 'N/A'}
                    </Text>
                  </Group>
                </Stack>
              </Paper>
            </SimpleGrid>
          </Stack>
        )}

        <Divider my="xl" />

        {/* History Section */}
        <div>
          <Group gap="xs" mb="md">
            <IconHistory size={28} />
            <Title order={3}>Scan History</Title>
          </Group>
          <Text c="dimmed" fz="sm" mb="lg">
            View all your previous IP reputation scans.
          </Text>
        </div>

        <Paper withBorder p="lg" radius="md" pos="relative">
          <LoadingOverlay visible={historyLoading} />

          {scans.length > 0 ? (
            <ScrollArea>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>IP Address</Table.Th>
                    <Table.Th>Score</Table.Th>
                    <Table.Th>Risk Level</Table.Th>
                    <Table.Th>Scanned At</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {scans.map((scan) => (
                    <Table.Tr key={scan.id}>
                      <Table.Td>
                        <Text fw={500}>{scan.ip_address}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="light" color={riskColor(scan.risk_level)}>
                          {scan.reputation_score}/100
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={riskColor(scan.risk_level)} tt="capitalize">
                          {scan.risk_level}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text fz="sm">{formatDate(scan.scanned_at)}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Button
                          size="xs"
                          variant="light"
                          leftSection={<IconEye size={14} />}
                          onClick={() => handleViewDetails(scan)}
                        >
                          View Details
                        </Button>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          ) : (
            <Text c="dimmed" ta="center" py="xl">
              No scans yet. Perform a scan above to start building your history.
            </Text>
          )}
        </Paper>
      </Stack>

      {/* Details Modal */}
      <Modal
        opened={detailsModalOpened}
        onClose={() => setDetailsModalOpened(false)}
        title={`IP Reputation Details - ${selectedScan?.ip_address}`}
        size="xl"
      >
        {selectedScan && (
          <Stack gap="lg">
            {/* Reputation Score */}
            <Paper withBorder p="lg" radius="md">
              <Group justify="space-between" align="center">
                <div>
                  <Text fz="sm" c="dimmed" fw={500}>
                    Reputation Score
                  </Text>
                  <Group gap="xs" align="baseline">
                    <Title order={1}>{selectedScan.reputation_score}</Title>
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
                    sections={[{ value: selectedScan.reputation_score, color: riskColor(selectedScan.risk_level) }]}
                    label={
                      <Text ta="center" fw={700} fz="md" tt="uppercase">
                        {selectedScan.risk_level}
                      </Text>
                    }
                  />
                </Center>
              </Group>
            </Paper>

            {/* Risk Factors */}
            {selectedScan.risk_factors.length > 0 && (
              <Paper withBorder p="lg" radius="md">
                <Title order={5} mb="md">
                  Risk Factors
                </Title>
                <Stack gap="xs">
                  {selectedScan.risk_factors.map((factor, i) => (
                    <Group key={i} gap="xs">
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
            )}

            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              {/* Geolocation */}
              <Paper withBorder p="lg" radius="md">
                <Title order={5} mb="md">
                  Geolocation
                </Title>
                <Stack gap="xs" fz="sm">
                  <Group justify="space-between">
                    <Text c="dimmed">Country:</Text>
                    <Text fw={500}>{selectedScan.geolocation?.country || 'N/A'}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text c="dimmed">Region:</Text>
                    <Text fw={500}>{selectedScan.geolocation?.region || 'N/A'}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text c="dimmed">City:</Text>
                    <Text fw={500}>{selectedScan.geolocation?.city || 'N/A'}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text c="dimmed">Timezone:</Text>
                    <Text fw={500}>{selectedScan.geolocation?.timezone || 'N/A'}</Text>
                  </Group>
                </Stack>
              </Paper>

              {/* Network Information */}
              <Paper withBorder p="lg" radius="md">
                <Title order={5} mb="md">
                  Network Information
                </Title>
                <Stack gap="xs" fz="sm">
                  <Group justify="space-between">
                    <Text c="dimmed">ISP:</Text>
                    <Text fw={500}>{selectedScan.network?.isp || 'N/A'}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text c="dimmed">Organization:</Text>
                    <Text fw={500}>{selectedScan.network?.org || 'N/A'}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text c="dimmed">AS Name:</Text>
                    <Text fw={500}>{selectedScan.network?.as_name || 'N/A'}</Text>
                  </Group>
                </Stack>
              </Paper>
            </SimpleGrid>

            {/* Flags */}
            <Paper withBorder p="lg" radius="md">
              <Title order={5} mb="md">
                IP Flags
              </Title>
              <Group>
                {selectedScan.is_proxy && (
                  <Badge variant="filled" color="red">
                    Proxy / VPN
                  </Badge>
                )}
                {selectedScan.is_hosting && (
                  <Badge variant="filled" color="orange">
                    Hosting
                  </Badge>
                )}
                {selectedScan.is_mobile && (
                  <Badge variant="filled" color="blue">
                    Mobile
                  </Badge>
                )}
                {!selectedScan.is_proxy && !selectedScan.is_hosting && !selectedScan.is_mobile && (
                  <Badge variant="light" color="green">
                    No Flags
                  </Badge>
                )}
              </Group>
            </Paper>

            {/* Scan Date */}
            <Paper withBorder p="lg" radius="md" bg="gray.0">
              <Text fz="sm" c="dimmed">
                Scanned at: {formatDate(selectedScan.scanned_at)}
              </Text>
            </Paper>
          </Stack>
        )}
      </Modal>
    </Container>
  );
};

