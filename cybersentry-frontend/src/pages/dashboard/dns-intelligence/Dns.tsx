import { useEffect, useState } from 'react';
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Center,
  Container,
  Group,
  Loader,
  Modal,
  Paper,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title,
  Tabs,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconEye,
  IconFileText,
  IconFingerprint,
  IconHistory,
  IconMailCheck,
  IconRefresh,
  IconSearch,
  IconShieldCheck,
  IconTrash,
  IconWorldWww,
} from '@tabler/icons-react';
import type { AxiosError } from 'axios';
import { GuidanceGroup, type GuidanceItem } from '../../../components/guidance/GuidanceHoverCard';
import DnsHealthResult from '../../../components/dns-intelligence/DnsHealthResult';
import { DnsHealthCheck } from '../../tools/dns/DnsHealthCheck';
import { DnsLookup } from '../../tools/dns/DnsLookup';
import { DnsPropagation } from '../../tools/dns/dns-propagation/DnsPropagation';
import { WhoisLookup } from '../../tools/domain/WhoisLookup';
import { TyposquattingDetection } from '../../tools/domain/TyposquattingDetection';
import { EmailSecurityAnalyzer } from '../../tools/email/EmailSecurityAnalyzer';
import {
  deleteDnsHealthHistoryEntry,
  getDnsHealthHistory,
  type DnsHealthHistoryEntry,
} from '../../../services/dns-tools';

const gradeColor = (grade: string) => {
  switch (grade) {
    case 'A':
      return 'green';
    case 'B':
      return 'teal';
    case 'C':
      return 'yellow';
    case 'D':
      return 'orange';
    case 'F':
      return 'red';
    default:
      return 'gray';
  }
};

const formatDate = (value?: string | null) => {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleString();
};

export const Dns = () => {
  const guidanceItems: GuidanceItem[] = [
    {
      label: 'What this page covers',
      title: 'DNS intelligence overview',
      description:
        'This page groups the main domain and DNS investigation tools so analysts can move from raw lookup to posture review without leaving the dashboard.',
      bullets: [
        'DNS Health scores configuration quality and highlights remediation items.',
        'DNS Lookup and Propagation help verify raw records and resolver consistency.',
        'WHOIS, Typosquatting, and Email Security add ownership and abuse context.',
      ],
      badge: 'DNS',
    },
    {
      label: 'How to read results',
      title: 'Interpreting DNS output',
      description:
        'Use DNS Health for prioritization, then confirm suspicious findings with the lower-level tools before escalating.',
      bullets: [
        'A low DNS Health score usually means missing controls like SPF, DMARC, NS redundancy, or basic resolution issues.',
        'Propagation mismatches indicate resolver divergence, not always a broken zone.',
        'History shows previously saved authenticated health checks for comparison over time.',
      ],
    },
  ];
  const [history, setHistory] = useState<DnsHealthHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [selectedScan, setSelectedScan] = useState<DnsHealthHistoryEntry | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deletingScanId, setDeletingScanId] = useState<number | null>(null);

  const loadHistory = async () => {
    setHistoryLoading(true);
    setHistoryError(null);

    try {
      const response = await getDnsHealthHistory();
      setHistory(response.data.dns_health_scans);
    } catch (requestError: unknown) {
      const axiosError = requestError as AxiosError<{ error?: string }>;
      setHistoryError(axiosError.response?.data?.error ?? 'Failed to load DNS health history.');
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    void loadHistory();
  }, []);

  const handleDeleteHistoryEntry = async (scanId: number) => {
    setDeletingScanId(scanId);

    try {
      await deleteDnsHealthHistoryEntry(scanId);
      setHistory((current) => current.filter((entry) => entry.id !== scanId));

      if (selectedScan?.id === scanId) {
        setSelectedScan(null);
        setDetailsOpen(false);
      }
    } catch {
      setHistoryError('Failed to delete DNS health scan.');
    } finally {
      setDeletingScanId(null);
    }
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <div>
          <Title order={2} mb={4}>
            <IconWorldWww size={28} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            DNS Intelligence
          </Title>
          <Text c="dimmed" fz="sm">
            Run domain and DNS analysis from the dashboard, then use DNS health as the score source for linked domain assets.
          </Text>
          <GuidanceGroup items={guidanceItems} />
        </div>

        <Tabs defaultValue="health">
          <Tabs.List>
            <Tabs.Tab value="health" leftSection={<IconShieldCheck size={16} />}>
              DNS Health
            </Tabs.Tab>
            <Tabs.Tab value="lookup" leftSection={<IconSearch size={16} />}>
              DNS Lookup
            </Tabs.Tab>
            <Tabs.Tab value="propagation" leftSection={<IconWorldWww size={16} />}>
              Propagation
            </Tabs.Tab>
            <Tabs.Tab value="whois" leftSection={<IconFileText size={16} />}>
              WHOIS
            </Tabs.Tab>
            <Tabs.Tab value="typosquatting" leftSection={<IconFingerprint size={16} />}>
              Typosquatting
            </Tabs.Tab>
            <Tabs.Tab value="email" leftSection={<IconMailCheck size={16} />}>
              Email Security
            </Tabs.Tab>
            <Tabs.Tab value="history" leftSection={<IconHistory size={16} />}>
              History
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="health" pt="xl">
            <DnsHealthCheck embedded />
          </Tabs.Panel>

          <Tabs.Panel value="lookup" pt="xl">
            <DnsLookup embedded />
          </Tabs.Panel>

          <Tabs.Panel value="propagation" pt="xl">
            <DnsPropagation embedded />
          </Tabs.Panel>

          <Tabs.Panel value="whois" pt="xl">
            <WhoisLookup embedded />
          </Tabs.Panel>

          <Tabs.Panel value="typosquatting" pt="xl">
            <TyposquattingDetection embedded />
          </Tabs.Panel>

          <Tabs.Panel value="email" pt="xl">
            <EmailSecurityAnalyzer embedded />
          </Tabs.Panel>

          <Tabs.Panel value="history" pt="xl">
            <Stack gap="lg">
              <Group justify="space-between">
                <div>
                  <Title order={4}>DNS Health History</Title>
                  <Text size="sm" c="dimmed">
                    Review saved DNS health scans for authenticated runs.
                  </Text>
                </div>
                <Button variant="light" leftSection={<IconRefresh size={16} />} onClick={() => void loadHistory()}>
                  Refresh history
                </Button>
              </Group>

              {historyError ? (
                <Alert icon={<IconAlertCircle size={16} />} color="red">
                  {historyError}
                </Alert>
              ) : null}

              {historyLoading ? (
                <Center py="xl">
                  <Loader />
                </Center>
              ) : history.length > 0 ? (
                <>
                  <SimpleGrid cols={{ base: 1, sm: 2, xl: 4 }} spacing="md">
                    <Paper p="md" radius="md" withBorder>
                      <Text size="xs" c="dimmed" fw={700}>
                        Total Scans
                      </Text>
                      <Text size="xl" fw={700}>
                        {history.length}
                      </Text>
                    </Paper>
                    <Paper p="md" radius="md" withBorder>
                      <Text size="xs" c="dimmed" fw={700}>
                        High Risk Domains
                      </Text>
                      <Text size="xl" fw={700} c="red">
                        {history.filter((entry) => entry.score < 60).length}
                      </Text>
                    </Paper>
                    <Paper p="md" radius="md" withBorder>
                      <Text size="xs" c="dimmed" fw={700}>
                        Best Grade
                      </Text>
                      <Text size="xl" fw={700}>
                        {history.find((entry) => entry.grade === 'A') ? 'A' : history[0]?.grade ?? '--'}
                      </Text>
                    </Paper>
                    <Paper p="md" radius="md" withBorder>
                      <Text size="xs" c="dimmed" fw={700}>
                        Latest Scan
                      </Text>
                      <Text size="sm" fw={700}>
                        {formatDate(history[0]?.scanned_at)}
                      </Text>
                    </Paper>
                  </SimpleGrid>

                  <Paper p="md" radius="md" withBorder>
                    <Table striped highlightOnHover>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Domain</Table.Th>
                          <Table.Th>Score</Table.Th>
                          <Table.Th>Grade</Table.Th>
                          <Table.Th>Scanned</Table.Th>
                          <Table.Th style={{ textAlign: 'center' }}>Actions</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {history.map((entry) => (
                          <Table.Tr key={entry.id}>
                            <Table.Td>
                              <Text fw={700}>{entry.domain_name}</Text>
                            </Table.Td>
                            <Table.Td>
                              <Badge color={gradeColor(entry.grade)}>{entry.score}/100</Badge>
                            </Table.Td>
                            <Table.Td>
                              <Badge variant="light" color={gradeColor(entry.grade)}>
                                {entry.grade}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm">{formatDate(entry.scanned_at)}</Text>
                            </Table.Td>
                            <Table.Td style={{ textAlign: 'center' }}>
                              <Center>
                                <Group gap="xs" wrap="nowrap">
                                  <ActionIcon
                                    color="blue"
                                    variant="light"
                                    title="View details"
                                    onClick={() => {
                                      setSelectedScan(entry);
                                      setDetailsOpen(true);
                                    }}
                                  >
                                    <IconEye size={16} />
                                  </ActionIcon>
                                  <ActionIcon
                                    color="red"
                                    variant="light"
                                    title="Delete"
                                    loading={deletingScanId === entry.id}
                                    onClick={() => void handleDeleteHistoryEntry(entry.id)}
                                  >
                                    <IconTrash size={16} />
                                  </ActionIcon>
                                </Group>
                              </Center>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </Paper>
                </>
              ) : (
                <Paper p="xl" radius="md" withBorder>
                  <Center>
                    <Stack gap="sm" align="center">
                      <IconHistory size={42} />
                      <Text fw={700}>No DNS history yet</Text>
                      <Text size="sm" c="dimmed" ta="center">
                        Run a DNS health check while authenticated to build history.
                      </Text>
                    </Stack>
                  </Center>
                </Paper>
              )}
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Stack>

      <Modal
        opened={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        title={selectedScan ? selectedScan.domain_name : 'DNS health details'}
        size="xl"
      >
        {selectedScan ? (
          <DnsHealthResult result={selectedScan} scoreLabel="DNS Health Score" />
        ) : null}
      </Modal>
    </Container>
  );
};
