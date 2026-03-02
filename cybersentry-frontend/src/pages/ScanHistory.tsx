import { useEffect, useState } from 'react';
import {
  Container,
  Title,
  Text,
  Stack,
  Paper,
  Group,
  Badge,
  Table,
  LoadingOverlay,
  Alert,
  Tabs,
  Card,
  ThemeIcon,
  Tooltip,
  ScrollArea,
  SimpleGrid,
  Box,
} from '@mantine/core';
import {
  IconHistory,
  IconAlertCircle,
  IconFingerprint,
  IconWorldWww,
  IconCalendar,
  IconShieldCheck,
  IconAlertTriangle,
} from '@tabler/icons-react';
import {
  getScanHistory,
  type IPReputationScanHistory,
  type DomainTyposquattingScanHistory,
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

export const ScanHistory = () => {
  const [ipScans, setIpScans] = useState<IPReputationScanHistory[]>([]);
  const [typoScans, setTypoScans] = useState<DomainTyposquattingScanHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>('ip');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getScanHistory();
      setIpScans(response.data.ip_scans);
      setTypoScans(response.data.typosquatting_scans);
    } catch (err: any) {
      const message =
        err.response?.data?.message || 'Failed to load scan history. Please try again.';
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

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <div>
          <Group gap="xs" mb={4}>
            <IconHistory size={28} />
            <Title order={2}>Scan History</Title>
          </Group>
          <Text c="dimmed" fz="sm">
            View your previous IP reputation and typosquatting scans.
          </Text>
        </div>

        {/* Statistics Cards */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
          <Card withBorder padding="lg" radius="md">
            <Group justify="space-between">
              <div>
                <Text fz="xs" c="dimmed" tt="uppercase" fw={700}>
                  IP Scans
                </Text>
                <Text fz="xl" fw={700}>
                  {ipScans.length}
                </Text>
              </div>
              <ThemeIcon size="lg" variant="light" color="blue">
                <IconFingerprint size={20} />
              </ThemeIcon>
            </Group>
          </Card>

          <Card withBorder padding="lg" radius="md">
            <Group justify="space-between">
              <div>
                <Text fz="xs" c="dimmed" tt="uppercase" fw={700}>
                  Typosquatting Scans
                </Text>
                <Text fz="xl" fw={700}>
                  {typoScans.length}
                </Text>
              </div>
              <ThemeIcon size="lg" variant="light" color="violet">
                <IconWorldWww size={20} />
              </ThemeIcon>
            </Group>
          </Card>

          <Card withBorder padding="lg" radius="md">
            <Group justify="space-between">
              <div>
                <Text fz="xs" c="dimmed" tt="uppercase" fw={700}>
                  High Risk IPs
                </Text>
                <Text fz="xl" fw={700}>
                  {ipScans.filter((s) => s.risk_level === 'high').length}
                </Text>
              </div>
              <ThemeIcon size="lg" variant="light" color="red">
                <IconAlertTriangle size={20} />
              </ThemeIcon>
            </Group>
          </Card>

          <Card withBorder padding="lg" radius="md">
            <Group justify="space-between">
              <div>
                <Text fz="xs" c="dimmed" tt="uppercase" fw={700}>
                  Total Threats
                </Text>
                <Text fz="xl" fw={700}>
                  {typoScans.reduce((sum, scan) => sum + scan.threat_count, 0)}
                </Text>
              </div>
              <ThemeIcon size="lg" variant="light" color="orange">
                <IconShieldCheck size={20} />
              </ThemeIcon>
            </Group>
          </Card>
        </SimpleGrid>

        {error && (
          <Alert icon={<IconAlertCircle size={18} />} color="red" title="Error" variant="light">
            {error}
          </Alert>
        )}

        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="ip" leftSection={<IconFingerprint size={16} />}>
              IP Reputation Scans ({ipScans.length})
            </Tabs.Tab>
            <Tabs.Tab value="typosquatting" leftSection={<IconWorldWww size={16} />}>
              Typosquatting Scans ({typoScans.length})
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="ip" pt="lg">
            <Paper withBorder radius="md" pos="relative">
              <LoadingOverlay visible={loading} />
              {ipScans.length === 0 ? (
                <Box p="xl">
                  <Text ta="center" c="dimmed">
                    No IP reputation scans found. Start scanning IPs to see them here.
                  </Text>
                </Box>
              ) : (
                <ScrollArea>
                  <Table striped highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>IP Address</Table.Th>
                        <Table.Th>Score</Table.Th>
                        <Table.Th>Risk Level</Table.Th>
                        <Table.Th>Flags</Table.Th>
                        <Table.Th>Location</Table.Th>
                        <Table.Th>Scanned At</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {ipScans.map((scan) => (
                        <Table.Tr key={scan.id}>
                          <Table.Td>
                            <Text ff="monospace" fw={500}>
                              {scan.ip_address}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge variant="light" color={riskColor(scan.risk_level)}>
                              {scan.reputation_score}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Badge variant="filled" color={riskColor(scan.risk_level)}>
                              {scan.risk_level.toUpperCase()}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Group gap="xs">
                              {scan.is_proxy && (
                                <Tooltip label="Proxy/VPN">
                                  <Badge size="sm" variant="light" color="red">
                                    Proxy
                                  </Badge>
                                </Tooltip>
                              )}
                              {scan.is_hosting && (
                                <Tooltip label="Hosting Provider">
                                  <Badge size="sm" variant="light" color="orange">
                                    Host
                                  </Badge>
                                </Tooltip>
                              )}
                              {scan.is_mobile && (
                                <Tooltip label="Mobile Network">
                                  <Badge size="sm" variant="light" color="blue">
                                    Mobile
                                  </Badge>
                                </Tooltip>
                              )}
                            </Group>
                          </Table.Td>
                          <Table.Td>
                            <Text fz="sm">
                              {scan.geolocation.city && scan.geolocation.country
                                ? `${scan.geolocation.city}, ${scan.geolocation.country}`
                                : scan.geolocation.country || '—'}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Group gap="xs">
                              <IconCalendar size={14} />
                              <Text fz="sm">{formatDate(scan.scanned_at)}</Text>
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </ScrollArea>
              )}
            </Paper>
          </Tabs.Panel>

          <Tabs.Panel value="typosquatting" pt="lg">
            <Paper withBorder radius="md" pos="relative">
              <LoadingOverlay visible={loading} />
              {typoScans.length === 0 ? (
                <Box p="xl">
                  <Text ta="center" c="dimmed">
                    No typosquatting scans found. Start detecting typosquatting to see results here.
                  </Text>
                </Box>
              ) : (
                <ScrollArea>
                  <Table striped highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Domain</Table.Th>
                        <Table.Th>Variants Checked</Table.Th>
                        <Table.Th>Similar Domains</Table.Th>
                        <Table.Th>Threats</Table.Th>
                        <Table.Th>Scanned At</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {typoScans.map((scan) => (
                        <Table.Tr key={scan.id}>
                          <Table.Td>
                            <Text ff="monospace" fw={500}>
                              {scan.original_domain}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text fz="sm">{scan.total_variants}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge variant="light" color="blue">
                              {scan.similar_domains.length}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Badge
                              variant="filled"
                              color={scan.threat_count > 0 ? 'red' : 'green'}
                            >
                              {scan.threat_count}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Group gap="xs">
                              <IconCalendar size={14} />
                              <Text fz="sm">{formatDate(scan.scanned_at)}</Text>
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </ScrollArea>
              )}
            </Paper>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
};


