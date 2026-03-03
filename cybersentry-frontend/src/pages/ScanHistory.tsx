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
  Card,
  ThemeIcon,
  ScrollArea,
  SimpleGrid,
  Box,
} from '@mantine/core';
import {
  IconHistory,
  IconAlertCircle,
  IconFingerprint,
  IconCalendar,
  IconShieldCheck,
  IconAlertTriangle,
} from '@tabler/icons-react';
import {
  getScanHistory,
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

export const ScanHistory = () => {
  const [ipScans, setIpScans] = useState<IPReputationScanHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getScanHistory();
      setIpScans(response.data.ip_scans);
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
            <Title order={2}>IP Reputation Scan History</Title>
          </Group>
          <Text c="dimmed" fz="sm">
            View your previous IP reputation scans.
          </Text>
        </div>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
          <Card withBorder padding="lg" radius="md">
            <Group justify="space-between">
              <div>
                <Text fz="xs" c="dimmed" tt="uppercase" fw={700}>
                  Total Scans
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
        </SimpleGrid>

        {error && (
          <Alert icon={<IconAlertCircle size={18} />} color="red" title="Error" variant="light">
            {error}
          </Alert>
        )}

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
                            <Badge size="sm" variant="light" color="red">
                              Proxy
                            </Badge>
                          )}
                          {scan.is_hosting && (
                            <Badge size="sm" variant="light" color="orange">
                              Host
                            </Badge>
                          )}
                          {scan.is_mobile && (
                            <Badge size="sm" variant="light" color="blue">
                              Mobile
                            </Badge>
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
      </Stack>
    </Container>
  );
};
