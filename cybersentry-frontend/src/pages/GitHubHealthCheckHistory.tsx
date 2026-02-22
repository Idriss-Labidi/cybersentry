import { useState } from 'react';
import {
  Container,
  Title,
  Text,
  Input,
  Table,
  Button,
  Stack,
  Group,
  Card,
  Badge,
  RingProgress,
  Center,
  SimpleGrid,
  Modal,
  Loader,
  Alert,
  ActionIcon,
  Paper,
} from '@mantine/core';
import {
  IconSearch,
  IconRefresh,
  IconTrash,
  IconEye,
  IconCalendar,
  IconAlertTriangle,
  IconCheck,
  IconGitFork,
  IconStar,
  IconUsers,
  IconAlertCircle,
} from '@tabler/icons-react';
import axios, { AxiosError } from 'axios';
import { getRiskColor, getRiskLabel } from '../utils/githubHealthUtils';
import {useAuth} from "../context/AuthContext.tsx";

type WarningLevel = 'critical' | 'high' | 'medium' | 'low' | 'warning' | 'info';

interface RepositoryInfo {
  id: number;
  owner: string;
  name: string;
  url: string;
  organization?: number | null;
  created_at: string;
  last_check_at: string;
}

interface Level1Releases {
  score: number;
  has_releases: boolean;
  release_count: number;
}

interface Level1Community {
  forks: number;
  score: number;
  stars: number;
  bus_factor_risk: string;
  total_contributors: number;
}

interface Level1Maintenance {
  score: number;
  status: string;
  last_push_date: string;
  days_since_last_commit: number;
}

interface Level1RawMetrics {
  forks: number;
  stars: number;
  language?: string;
  watchers: number;
  open_issues: number;
}

interface Level1Documentation {
  score: number;
  checks: {
    topics: string[];
    has_homepage: boolean;
    has_description: boolean;
  };
}

interface Level1SecurityBasics {
  score: number;
  checks: {
    is_private: boolean;
    has_license: boolean;
    license_type: string | null;
    has_vulnerability_alerts: boolean;
  };
}

interface Level1BranchProtection {
  score: number;
  branch_count: number;
  default_branch_protected: boolean;
}

interface Level1Data {
  releases?: Level1Releases;
  community?: Level1Community;
  last_push?: string;
  maintenance?: Level1Maintenance;
  raw_metrics?: Level1RawMetrics;
  documentation?: Level1Documentation;
  security_basics?: Level1SecurityBasics;
  branch_protection?: Level1BranchProtection;
}

interface SecurityFileCheckItem {
  exists: boolean;
  size_bytes: number;
}

interface Level2Data {
  dependencies?: Record<string, unknown>;
  security_file_check?: Record<string, SecurityFileCheckItem>;
  code_quality_signals?: {
    suspicious_code_patterns: string[];
  };
}

interface Level3Data {
  code_scanning?: {
    available: boolean;
  };
  secret_scanning?: {
    available: boolean;
  };
  dependabot_alerts?: {
    available: boolean;
    error?: string;
  };
}

interface WarningItem {
  level: WarningLevel;
  message: string;
  category: string;
}

interface RepositoryCheckResult {
  id: number;
  repository: RepositoryInfo;
  risk_score: number;
  level1_data?: Level1Data;
  level2_data?: Level2Data;
  level3_data?: Level3Data;
  summary: string;
  warnings?: WarningItem[];
  recommendations?: string[];
  check_timestamp: string;
}

type CheckResultsResponse = RepositoryCheckResult[] | { results: RepositoryCheckResult[] };

const getResultsFromResponse = (data: CheckResultsResponse | null | undefined): RepositoryCheckResult[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if ('results' in data && Array.isArray(data.results)) return data.results;
  return [];
};

const GitHubHealthCheckHistory = () => {
  const { user } = useAuth();
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<RepositoryCheckResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<RepositoryCheckResult | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const fetchResults = async (url?: string) => {
    const urlToUse = url || repositoryUrl;

    if (!urlToUse) {
      setError('Please enter a valid GitHub repository URL');
      return;
    }

    const accessToken = user?.access_token;
    if (!accessToken) {
      setError('You must be logged in to run this check. Please sign in again.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<CheckResultsResponse>(
        'http://localhost:8000/github-health/repository_history/',
        {
          params: {
            url: urlToUse
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          }
        }
      );
      setResults(getResultsFromResponse(response.data));
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ error?: string }>;
      setError(axiosError.response?.data?.error ?? 'Failed to fetch results');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteResult = async (id: number) => {
    try {
      await axios.delete(`http://localhost:8000/api/github-health/check-results/${id}/`);
      setResults((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setError('Failed to delete result');
    }
  };

  const filteredResults = results.filter(
    (result) =>
      result.repository.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.repository.owner.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewDetails = (result: RepositoryCheckResult) => {
    setSelectedResult(result);
    setDetailsModalOpen(true);
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={1} mb="sm">
            Check History
          </Title>
          <Text c="dimmed">
            View and manage all previous GitHub repository health checks
          </Text>
        </div>

        {/* Search and Controls */}
        <Group justify="space-between">
          <Input
            placeholder="Enter GitHub repository URL (e.g., https://github.com/owner/repo)"
            leftSection={<IconSearch size={16} />}
            value={repositoryUrl}
            onChange={(e) => setRepositoryUrl(e.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Button
            leftSection={<IconRefresh size={16} />}
            variant="light"
            onClick={() => fetchResults()}
            loading={loading}
          >
            Fetch History
          </Button>
        </Group>

        {/* Filter Results */}
        {results.length > 0 && (
          <Input
            placeholder="Filter results..."
            leftSection={<IconSearch size={16} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.currentTarget.value)}
          />
        )}

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red">
            {error}
          </Alert>
        )}

        {/* Results Summary Cards */}
        {!loading && filteredResults.length > 0 && (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
            <Paper p="md" radius="md" withBorder>
              <Text size="xs" c="dimmed" fw={700} mb="xs">
                Total Checks
              </Text>
              <Text size="xl" fw={700}>
                {filteredResults.length}
              </Text>
            </Paper>

            <Paper p="md" radius="md" withBorder>
              <Text size="xs" c="dimmed" fw={700} mb="xs">
                Average Risk Score
              </Text>
              <Text
                size="xl"
                fw={700}
                c={getRiskColor(
                  Math.round(
                    filteredResults.reduce((sum, r) => sum + r.risk_score, 0) /
                      filteredResults.length
                  )
                )}
              >
                {Math.round(
                  filteredResults.reduce((sum, r) => sum + r.risk_score, 0) /
                    filteredResults.length
                )}
              </Text>
            </Paper>

            <Paper p="md" radius="md" withBorder>
              <Text size="xs" c="dimmed" fw={700} mb="xs">
                Critical Risks
              </Text>
              <Text size="xl" fw={700} c="red">
                {filteredResults.filter((r) => r.risk_score >= 75).length}
              </Text>
            </Paper>

            <Paper p="md" radius="md" withBorder>
              <Text size="xs" c="dimmed" fw={700} mb="xs">
                Low Risk
              </Text>
              <Text size="xl" fw={700} c="green">
                {filteredResults.filter((r) => r.risk_score < 25).length}
              </Text>
            </Paper>
          </SimpleGrid>
        )}

        {/* Results Table */}
        {loading ? (
          <Center py="xl">
            <Loader />
          </Center>
        ) : filteredResults.length > 0 ? (
          <Card withBorder radius="md">
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Repository</Table.Th>
                  <Table.Th>Risk Score</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Last Checked</Table.Th>
                  <Table.Th align="right">Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredResults.map((result) => (
                  <Table.Tr key={result.id}>
                    <Table.Td>
                      <div>
                        <Text fw={700} size="sm">
                          {result.repository.owner}/{result.repository.name}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {result.repository.url}
                        </Text>
                      </div>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={8}>
                        <Center>
                          <RingProgress
                            sections={[
                              {
                                value: result.risk_score,
                                color: getRiskColor(result.risk_score),
                              },
                            ]}
                            label={
                              <Text size="xs" fw={700}>
                                {result.risk_score}
                              </Text>
                            }
                            size={40}
                          />
                        </Center>
                        <Text size="sm" fw={700}>
                          {result.risk_score}/100
                        </Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={getRiskColor(result.risk_score)}>
                        {getRiskLabel(result.risk_score)}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        <IconCalendar size={14} color="gray" />
                        <Text size="sm">
                          {new Date(result.check_timestamp).toLocaleDateString()}
                        </Text>
                      </Group>
                    </Table.Td>
                    <Table.Td align="right">
                      <Group justify="flex-end" gap="xs">
                        <ActionIcon
                          color="blue"
                          variant="light"
                          onClick={() => handleViewDetails(result)}
                          title="View details"
                        >
                          <IconEye size={16} />
                        </ActionIcon>
                        <ActionIcon
                          color="red"
                          variant="light"
                          onClick={() => deleteResult(result.id)}
                          title="Delete"
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Card>
        ) : (
          <Paper p="xl" radius="md" withBorder>
            <Center>
              <Stack gap="md" align="center">
                <IconSearch size={48} color="gray" style={{ opacity: 0.5 }} />
                <div>
                  <Text fw={700} ta="center">
                    No checks found
                  </Text>
                  <Text size="sm" c="dimmed" ta="center">
                    {searchTerm
                      ? 'Try adjusting your search terms'
                      : 'Enter a GitHub repository URL above and click "Fetch History" to view check results'}
                  </Text>
                </div>
              </Stack>
            </Center>
          </Paper>
        )}
      </Stack>

      {/* Details Modal */}
      <Modal
        opened={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title={selectedResult && `${selectedResult.repository.owner}/${selectedResult.repository.name}`}
        size="xl"
        scrollAreaComponent={undefined}
      >
        {selectedResult && (
          <div style={{ maxHeight: '70vh', overflow: 'auto' }}>
            <Stack gap="md">
              {/* Header */}
              <Paper p="md" radius="md" bg="gray.0">
                <Group justify="space-between" mb="md">
                  <div>
                    <Text fw={700}>{selectedResult.repository.url}</Text>
                  </div>
                  <Badge color={getRiskColor(selectedResult.risk_score)} size="lg">
                    {getRiskLabel(selectedResult.risk_score)}
                  </Badge>
                </Group>

                <Center my="md">
                  <RingProgress
                    sections={[
                      {
                        value: selectedResult.risk_score,
                        color: getRiskColor(selectedResult.risk_score),
                      },
                    ]}
                    label={
                      <div>
                        <Text fw={700} ta="center">
                          {selectedResult.risk_score}%
                        </Text>
                      </div>
                    }
                    size={100}
                  />
                </Center>

                <Text size="sm" c="dimmed" ta="center" mt="md">
                  Checked on {new Date(selectedResult.check_timestamp).toLocaleString()}
                </Text>
              </Paper>

              {/* Level 1 Summary */}
              {selectedResult.level1_data && (
                <Stack gap="xs">
                  <Text fw={700}>Level 1: REST API Metrics</Text>
                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                    <Group justify="space-between" p="xs" bg="gray.0">
                      <Group gap={8}>
                        <IconStar size={16} />
                        <Text size="sm">Stars</Text>
                      </Group>
                      <Text fw={700}>{selectedResult.level1_data.raw_metrics?.stars || 0}</Text>
                    </Group>
                    <Group justify="space-between" p="xs" bg="gray.0">
                      <Group gap={8}>
                        <IconGitFork size={16} />
                        <Text size="sm">Forks</Text>
                      </Group>
                      <Text fw={700}>{selectedResult.level1_data.raw_metrics?.forks || 0}</Text>
                    </Group>
                    <Group justify="space-between" p="xs" bg="gray.0">
                      <Group gap={8}>
                        <IconUsers size={16} />
                        <Text size="sm">Contributors</Text>
                      </Group>
                      <Text fw={700}>{selectedResult.level1_data.community?.total_contributors || 0}</Text>
                    </Group>
                    <Group justify="space-between" p="xs" bg="gray.0">
                      <Text size="sm">Maintenance Status</Text>
                      <Badge size="sm" color={
                        selectedResult.level1_data.maintenance?.status === 'Active' ? 'green' : 'yellow'
                      }>
                        {selectedResult.level1_data.maintenance?.status}
                      </Badge>
                    </Group>
                  </SimpleGrid>
                </Stack>
              )}

              {/* Warnings */}
              {selectedResult.warnings && selectedResult.warnings.length > 0 && (
                <Stack gap="xs">
                  <Text fw={700}>⚠️ Warnings</Text>
                  {selectedResult.warnings.map((warning, idx) => (
                    <Alert
                      key={idx}
                      icon={<IconAlertTriangle size={14} />}
                      color={warning.level === 'critical' ? 'red' : 'orange'}
                      title={warning.category}
                      p="sm"
                    >
                      {warning.message}
                    </Alert>
                  ))}
                </Stack>
              )}

              {/* Recommendations */}
              {selectedResult.recommendations && selectedResult.recommendations.length > 0 && (
                <Stack gap="xs">
                  <Text fw={700}>💡 Recommendations</Text>
                  {selectedResult.recommendations.map((rec, idx) => (
                    <Group key={idx} gap={8} p="xs" bg="gray.0">
                      <IconCheck size={16} color="green" />
                      <Text size="sm">{rec}</Text>
                    </Group>
                  ))}
                </Stack>
              )}

              {/* Summary */}
              <Paper p="md" radius="md" bg="blue.0">
                <Text size="sm" fw={700} c="blue.9">
                  {selectedResult.summary}
                </Text>
              </Paper>
            </Stack>
          </div>
        )}
      </Modal>
    </Container>
  );
};

export default GitHubHealthCheckHistory;

