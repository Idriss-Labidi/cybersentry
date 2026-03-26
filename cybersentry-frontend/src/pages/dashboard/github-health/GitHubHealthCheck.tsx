import { useEffect, useMemo, useState } from 'react';
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  Center,
  Container,
  Divider,
  Group,
  Input,
  List,
  Loader,
  Modal,
  MultiSelect,
  Paper,
  RingProgress,
  SimpleGrid,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconCalendar,
  IconCheck,
  IconExternalLink,
  IconEye,
  IconHistory,
  IconRefresh,
  IconSearch,
  IconShield,
  IconTrash,
} from '@tabler/icons-react';
import type { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import { getRiskColor, getRiskLabel } from '../../../utils/githubHealthUtils';
import { useAuth } from '../../../context/auth/useAuth';
import { lookupAsset, type Asset, type AssetPayload } from '../../../services/assets';
import {
  checkRepositoryHealth,
  deleteRepositoryCheckResult,
  getRepositoryCheckResult,
  getRepositoryHistory,
} from '../../../services/github-tools';
import { getUserSettings } from '../../../services/settings';

interface RepositoryInfo {
  id: number;
  owner: string;
  name: string;
  url: string;
  organization: number;
  created_at: string;
  last_check_at: string | null;
}

interface WarningItem {
  level: string;
  message: string;
  category: string;
}

interface CheckResultDetail {
  id: number;
  repository: RepositoryInfo;
  risk_score: number;
  level1_data?: {
    raw_metrics?: { stars?: number; forks?: number; open_issues?: number; language?: string };
    community?: { total_contributors?: number };
    maintenance?: { status?: string; last_push_date?: string; days_since_last_commit?: number };
  };
  level2_data?: {
    dependencies?: Record<string, string>;
    security_file_check?: Record<string, { exists: boolean; size_bytes: number }>;
    code_quality_signals?: { suspicious_code_patterns?: string[] };
  };
  level3_data?: {
    code_scanning?: { available?: boolean };
    secret_scanning?: { available?: boolean };
    dependabot_alerts?: { available?: boolean; error?: string };
  };
  summary: string;
  warnings?: WarningItem[];
  recommendations?: string[];
  check_timestamp: string;
}

interface CheckResponse {
  message?: string;
  result: CheckResultDetail;
}

interface HistorySummary {
  id: number;
  repository_url: string;
  repository_name: string;
  risk_score: number;
  summary: string;
  check_timestamp: string;
  repository: {
    owner: string;
    name: string;
    url: string;
  };
}

const parseRepositoryUrl = (url?: string) => {
  const match = url?.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)/i);
  return {
    owner: match?.[1] ?? 'Unknown',
    name: match?.[2]?.replace(/\.git$/, '') ?? 'Unknown',
  };
};

const normalizeHistoryEntry = (entry: Omit<HistorySummary, 'repository'>): HistorySummary => ({
  ...entry,
  repository: {
    ...parseRepositoryUrl(entry.repository_url),
    url: entry.repository_url,
  },
});

const formatDate = (value?: string | null) => {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleString();
};

const GitHubHealthCheck = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [url, setUrl] = useState('');
  const [levels, setLevels] = useState<string[]>(['1', '2', '3']);
  const [useCache, setUseCache] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckResponse | null>(null);
  const [linkedAsset, setLinkedAsset] = useState<Asset | null>(null);
  const [assetDefaults, setAssetDefaults] = useState<AssetPayload | null>(null);
  const [assetLookupLoading, setAssetLookupLoading] = useState(false);
  const [history, setHistory] = useState<HistorySummary[]>([]);
  const [historySearch, setHistorySearch] = useState('');
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<CheckResultDetail | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const loadHistory = async () => {
    setHistoryLoading(true);
    setHistoryError(null);

    try {
      const response = await getRepositoryHistory<Omit<HistorySummary, 'repository'>[]>({});
      setHistory(response.data.map(normalizeHistoryEntry));
    } catch (requestError: unknown) {
      const axiosError = requestError as AxiosError<{ error?: string }>;
      setHistoryError(axiosError.response?.data?.error ?? 'Failed to load GitHub history.');
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    const loadCachePreference = async () => {
      try {
        const response = await getUserSettings();
        setUseCache(response.data.use_cache);
      } catch {
        // Keep local default.
      }
    };

    void loadCachePreference();
    void loadHistory();
  }, []);

  useEffect(() => {
    const repositoryUrl = result?.result.repository.url;
    if (!repositoryUrl) {
      setLinkedAsset(null);
      setAssetDefaults(null);
      return;
    }

    const loadLinkedAsset = async () => {
      setAssetLookupLoading(true);

      try {
        const response = await lookupAsset('github_repo', repositoryUrl);
        setLinkedAsset(response.data.asset);
        setAssetDefaults(response.data.defaults);
      } catch {
        setLinkedAsset(null);
        setAssetDefaults(null);
      } finally {
        setAssetLookupLoading(false);
      }
    };

    void loadLinkedAsset();
  }, [result?.result.repository.url]);

  const handleCheck = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!url.trim()) {
      setError('Please enter a GitHub repository URL.');
      return;
    }

    if (!user?.access_token) {
      setError('You must be logged in to run this check. Please sign in again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await checkRepositoryHealth<CheckResponse>({
        url: url.trim(),
        levels,
        use_cache: useCache,
      });
      setResult(response.data);
      void loadHistory();
    } catch (requestError: unknown) {
      const axiosError = requestError as AxiosError<{ error?: string }>;
      setError(axiosError.response?.data?.error ?? 'Failed to check repository.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewHistoryResult = async (resultId: number) => {
    setDetailsLoading(true);

    try {
      const response = await getRepositoryCheckResult<CheckResultDetail>(resultId);
      setSelectedResult(response.data);
      setDetailsOpen(true);
    } catch (requestError: unknown) {
      const axiosError = requestError as AxiosError<{ error?: string }>;
      setHistoryError(axiosError.response?.data?.error ?? 'Failed to load check details.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDeleteHistoryResult = async (resultId: number) => {
    try {
      await deleteRepositoryCheckResult(resultId);
      setHistory((current) => current.filter((entry) => entry.id !== resultId));

      if (selectedResult?.id === resultId) {
        setDetailsOpen(false);
        setSelectedResult(null);
      }
    } catch {
      setHistoryError('Failed to delete check result.');
    }
  };

  const handleSaveAsAsset = () => {
    if (!assetDefaults) {
      return;
    }

    navigate('/dashboard/assets', {
      state: {
        prefillAsset: assetDefaults,
      },
    });
  };

  const filteredHistory = useMemo(() => {
    const search = historySearch.trim().toLowerCase();

    if (!search) {
      return history;
    }

    return history.filter((entry) => {
      const repository = `${entry.repository.owner}/${entry.repository.name}`.toLowerCase();
      return (
        repository.includes(search) ||
        entry.repository.url.toLowerCase().includes(search) ||
        entry.summary.toLowerCase().includes(search)
      );
    });
  }, [history, historySearch]);

  const renderRepositoryStats = (detail: CheckResultDetail) => (
    <SimpleGrid cols={{ base: 1, sm: 2, xl: 4 }} spacing="md">
      <Paper p="md" radius="md" withBorder>
        <Text size="xs" c="dimmed" fw={700}>
          Stars
        </Text>
        <Text size="xl" fw={700}>
          {detail.level1_data?.raw_metrics?.stars ?? 0}
        </Text>
      </Paper>
      <Paper p="md" radius="md" withBorder>
        <Text size="xs" c="dimmed" fw={700}>
          Forks
        </Text>
        <Text size="xl" fw={700}>
          {detail.level1_data?.raw_metrics?.forks ?? 0}
        </Text>
      </Paper>
      <Paper p="md" radius="md" withBorder>
        <Text size="xs" c="dimmed" fw={700}>
          Contributors
        </Text>
        <Text size="xl" fw={700}>
          {detail.level1_data?.community?.total_contributors ?? 0}
        </Text>
      </Paper>
      <Paper p="md" radius="md" withBorder>
        <Text size="xs" c="dimmed" fw={700}>
          Maintenance
        </Text>
        <Text size="xl" fw={700}>
          {detail.level1_data?.maintenance?.status ?? 'Unknown'}
        </Text>
      </Paper>
    </SimpleGrid>
  );

  const renderCheckSections = (detail: CheckResultDetail) => {
    const dependencyEntries = Object.entries(detail.level2_data?.dependencies ?? {});
    const suspiciousPatterns = detail.level2_data?.code_quality_signals?.suspicious_code_patterns ?? [];
    const securityFiles = Object.entries(detail.level2_data?.security_file_check ?? {});

    return (
      <Stack gap="lg">
        {renderRepositoryStats(detail)}

        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
          <Paper p="md" radius="md" withBorder>
            <Text fw={700} mb="md">
              Repository summary
            </Text>
            <Stack gap="sm">
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  URL
                </Text>
                <Text size="sm">{detail.repository.url}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Created
                </Text>
                <Text size="sm">{formatDate(detail.repository.created_at)}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Last check
                </Text>
                <Text size="sm">{formatDate(detail.check_timestamp)}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Last push
                </Text>
                <Text size="sm">{formatDate(detail.level1_data?.maintenance?.last_push_date)}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Language
                </Text>
                <Text size="sm">{detail.level1_data?.raw_metrics?.language ?? 'Unknown'}</Text>
              </Group>
            </Stack>
          </Paper>

          <Paper p="md" radius="md" withBorder>
            <Text fw={700} mb="md">
              Security capabilities
            </Text>
            <Stack gap="sm">
              <Group justify="space-between">
                <Text size="sm">Code scanning</Text>
                <Badge color={detail.level3_data?.code_scanning?.available ? 'green' : 'gray'}>
                  {detail.level3_data?.code_scanning?.available ? 'Available' : 'Not available'}
                </Badge>
              </Group>
              <Group justify="space-between">
                <Text size="sm">Secret scanning</Text>
                <Badge color={detail.level3_data?.secret_scanning?.available ? 'green' : 'gray'}>
                  {detail.level3_data?.secret_scanning?.available ? 'Available' : 'Not available'}
                </Badge>
              </Group>
              <Group justify="space-between">
                <Text size="sm">Dependabot alerts</Text>
                <Badge color={detail.level3_data?.dependabot_alerts?.available ? 'green' : 'gray'}>
                  {detail.level3_data?.dependabot_alerts?.available ? 'Available' : 'Not available'}
                </Badge>
              </Group>
              {detail.level3_data?.dependabot_alerts?.error ? (
                <Alert color="yellow" variant="light" title="Dependabot note">
                  {detail.level3_data.dependabot_alerts.error}
                </Alert>
              ) : null}
            </Stack>
          </Paper>
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
          <Paper p="md" radius="md" withBorder>
            <Text fw={700} mb="md">
              Dependencies
            </Text>
            {dependencyEntries.length > 0 ? (
              <Stack gap="xs">
                {dependencyEntries.slice(0, 8).map(([name, version]) => (
                  <Group key={name} justify="space-between">
                    <Text size="sm">{name}</Text>
                    <Badge variant="light">{version}</Badge>
                  </Group>
                ))}
              </Stack>
            ) : (
              <Text c="dimmed" size="sm">
                No dependency data available.
              </Text>
            )}
          </Paper>

          <Paper p="md" radius="md" withBorder>
            <Text fw={700} mb="md">
              Security files
            </Text>
            {securityFiles.length > 0 ? (
              <Stack gap="xs">
                {securityFiles.map(([name, file]) => (
                  <Group key={name} justify="space-between">
                    <Text size="sm">{name}</Text>
                    <Badge color={file.exists ? 'green' : 'red'}>{file.exists ? 'Present' : 'Missing'}</Badge>
                  </Group>
                ))}
              </Stack>
            ) : (
              <Text c="dimmed" size="sm">
                No file inspection data available.
              </Text>
            )}
          </Paper>
        </SimpleGrid>

        <Paper p="md" radius="md" withBorder>
          <Text fw={700} mb="md">
            Code quality signals
          </Text>
          {suspiciousPatterns.length > 0 ? (
            <List icon={<IconAlertTriangle size={16} color="orange" />}>
              {suspiciousPatterns.map((pattern) => (
                <List.Item key={pattern}>{pattern}</List.Item>
              ))}
            </List>
          ) : (
            <Group gap={8}>
              <IconCheck size={16} color="green" />
              <Text size="sm">No suspicious code patterns detected.</Text>
            </Group>
          )}
        </Paper>

        {detail.warnings && detail.warnings.length > 0 ? (
          <Card withBorder radius="md" padding="lg">
            <Text fw={700} mb="md">
              Warnings and issues
            </Text>
            <Stack gap="sm">
              {detail.warnings.map((warning, index) => (
                <Alert
                  key={`${warning.category}-${index}`}
                  icon={<IconAlertTriangle size={16} />}
                  color={warning.level === 'critical' ? 'red' : warning.level === 'warning' ? 'yellow' : 'orange'}
                  title={warning.category}
                >
                  {warning.message}
                </Alert>
              ))}
            </Stack>
          </Card>
        ) : null}

        {detail.recommendations && detail.recommendations.length > 0 ? (
          <Card withBorder radius="md" padding="lg">
            <Text fw={700} mb="md">
              Recommendations
            </Text>
            <List icon={<IconCheck size={16} color="green" />}>
              {detail.recommendations.map((recommendation) => (
                <List.Item key={recommendation}>{recommendation}</List.Item>
              ))}
            </List>
          </Card>
        ) : null}
      </Stack>
    );
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={1} mb="sm">
            GitHub Health
          </Title>
          <Text c="dimmed">
            Run repository checks and review the full GitHub history from one page.
          </Text>
        </div>

        <Tabs defaultValue="scan">
          <Tabs.List>
            <Tabs.Tab value="scan" leftSection={<IconSearch size={16} />}>
              New Check
            </Tabs.Tab>
            <Tabs.Tab value="history" leftSection={<IconHistory size={16} />}>
              History
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="scan" pt="xl">
            <Stack gap="xl">
              <Card withBorder radius="md" padding="lg">
                <form onSubmit={handleCheck}>
                  <Stack gap="md">
                    <TextInput
                      label="GitHub Repository URL"
                      placeholder="https://github.com/owner/repo"
                      value={url}
                      onChange={(event) => setUrl(event.currentTarget.value)}
                    />

                    <MultiSelect
                      label="Check Levels"
                      placeholder="Select levels to check"
                      data={[
                        { value: '1', label: 'Level 1: REST API & Metrics' },
                        { value: '2', label: 'Level 2: File Inspection' },
                        { value: '3', label: 'Level 3: Security APIs' },
                      ]}
                      value={levels}
                      onChange={setLevels}
                      searchable
                      clearable
                    />

                    <Group justify="space-between">
                      <Text size="sm">
                        <Tooltip label="Use cached results from less than 1 hour ago">
                          <span>Use cached results</span>
                        </Tooltip>
                      </Text>
                      <Button size="xs" variant={useCache ? 'default' : 'light'} onClick={() => setUseCache(!useCache)}>
                        {useCache ? 'Enabled' : 'Disabled'}
                      </Button>
                    </Group>

                    <Button type="submit" fullWidth size="md" loading={loading} leftSection={<IconSearch size={16} />}>
                      {loading ? 'Checking Repository...' : 'Check Repository'}
                    </Button>
                  </Stack>
                </form>
              </Card>

              {error ? (
                <Alert icon={<IconAlertCircle size={16} />} color="red" title="Error">
                  {error}
                </Alert>
              ) : null}

              {result ? (
                <Stack gap="xl">
                  {result.message ? (
                    <Alert icon={<IconCheck size={16} />} color="blue">
                      {result.message}
                    </Alert>
                  ) : null}

                  <Paper p="lg" radius="md" withBorder>
                    <Group justify="space-between" mb="md">
                      <div>
                        <Title order={2}>
                          {result.result.repository.owner}/{result.result.repository.name}
                        </Title>
                        <Text size="sm" c="dimmed" mt={4}>
                          {result.result.repository.url}
                        </Text>
                      </div>
                      <Center>
                        <RingProgress
                          sections={[{ value: result.result.risk_score, color: getRiskColor(result.result.risk_score) }]}
                          label={<Text fw={700}>{result.result.risk_score}%</Text>}
                          size={110}
                        />
                      </Center>
                    </Group>

                    <Group gap="sm" mb="md">
                      <Badge size="lg" color={getRiskColor(result.result.risk_score)}>
                        {getRiskLabel(result.result.risk_score)}
                      </Badge>
                      <Badge variant="light">{result.result.summary}</Badge>
                    </Group>

                    <Group gap="sm" mb="md">
                      {linkedAsset ? (
                        <Button
                          variant="light"
                          onClick={() => navigate(`/dashboard/assets/${linkedAsset.id}`)}
                          leftSection={<IconExternalLink size={16} />}
                        >
                          Open linked asset
                        </Button>
                      ) : assetDefaults ? (
                        <Button
                          variant="light"
                          onClick={handleSaveAsAsset}
                          leftSection={<IconShield size={16} />}
                        >
                          Save as asset
                        </Button>
                      ) : null}
                      {assetLookupLoading ? (
                        <Text size="sm" c="dimmed">
                          Checking asset inventory link...
                        </Text>
                      ) : null}
                    </Group>

                    <Divider my="md" />

                    {renderCheckSections(result.result)}
                  </Paper>
                </Stack>
              ) : null}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="history" pt="xl">
            <Stack gap="lg">
              <Group justify="space-between" align="flex-end">
                <Input
                  placeholder="Filter by repository, URL, or summary"
                  leftSection={<IconSearch size={16} />}
                  value={historySearch}
                  onChange={(event) => setHistorySearch(event.currentTarget.value)}
                  style={{ flex: 1 }}
                />
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
              ) : filteredHistory.length > 0 ? (
                <>
                  <SimpleGrid cols={{ base: 1, sm: 2, xl: 4 }} spacing="md">
                    <Paper p="md" radius="md" withBorder>
                      <Text size="xs" c="dimmed" fw={700}>
                        Total Checks
                      </Text>
                      <Text size="xl" fw={700}>
                        {filteredHistory.length}
                      </Text>
                    </Paper>
                    <Paper p="md" radius="md" withBorder>
                      <Text size="xs" c="dimmed" fw={700}>
                        Critical Risks
                      </Text>
                      <Text size="xl" fw={700} c="red">
                        {filteredHistory.filter((entry) => entry.risk_score >= 75).length}
                      </Text>
                    </Paper>
                    <Paper p="md" radius="md" withBorder>
                      <Text size="xs" c="dimmed" fw={700}>
                        Low Risk
                      </Text>
                      <Text size="xl" fw={700} c="green">
                        {filteredHistory.filter((entry) => entry.risk_score < 25).length}
                      </Text>
                    </Paper>
                    <Paper p="md" radius="md" withBorder>
                      <Text size="xs" c="dimmed" fw={700}>
                        Latest Check
                      </Text>
                      <Text size="sm" fw={700}>
                        {formatDate(filteredHistory[0]?.check_timestamp)}
                      </Text>
                    </Paper>
                  </SimpleGrid>

                  <Card withBorder radius="md">
                    <Table striped highlightOnHover>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Repository</Table.Th>
                          <Table.Th>Risk</Table.Th>
                          <Table.Th>Checked</Table.Th>
                          <Table.Th style={{ textAlign: 'center' }}>Actions</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {filteredHistory.map((entry) => (
                          <Table.Tr key={entry.id}>
                            <Table.Td>
                              <Text fw={700}>{entry.repository.owner}/{entry.repository.name}</Text>
                              <Text size="xs" c="dimmed">
                                {entry.repository.url}
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              <Badge color={getRiskColor(entry.risk_score)}>
                                {entry.risk_score}/100
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Group gap={6}>
                                <IconCalendar size={14} />
                                <Text size="sm">{formatDate(entry.check_timestamp)}</Text>
                              </Group>
                            </Table.Td>
                            <Table.Td style={{ textAlign: 'center' }}>
                              <Center>
                                <Group gap="xs" wrap="nowrap">
                                  <ActionIcon
                                    color="blue"
                                    variant="light"
                                    onClick={() => void handleViewHistoryResult(entry.id)}
                                    title="View details"
                                  >
                                    <IconEye size={16} />
                                  </ActionIcon>
                                  <ActionIcon
                                    color="red"
                                    variant="light"
                                    onClick={() => void handleDeleteHistoryResult(entry.id)}
                                    title="Delete"
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
                  </Card>
                </>
              ) : (
                <Paper p="xl" radius="md" withBorder>
                  <Center>
                    <Stack gap="sm" align="center">
                      <IconSearch size={42} />
                      <Text fw={700}>No GitHub checks found</Text>
                      <Text size="sm" c="dimmed" ta="center">
                        {historySearch ? 'Try adjusting the filter.' : 'Run the first repository check to build history.'}
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
        title={selectedResult ? `${selectedResult.repository.owner}/${selectedResult.repository.name}` : 'Check details'}
        size="xl"
      >
        {detailsLoading ? (
          <Center py="xl">
            <Loader />
          </Center>
        ) : selectedResult ? (
          <Stack gap="lg">
            <Paper p="lg" radius="md" withBorder>
              <Group justify="space-between" mb="md">
                <div>
                  <Text fw={700}>{selectedResult.repository.url}</Text>
                  <Text size="sm" c="dimmed" mt={4}>
                    {selectedResult.summary}
                  </Text>
                </div>
                <Badge size="lg" color={getRiskColor(selectedResult.risk_score)}>
                  {getRiskLabel(selectedResult.risk_score)}
                </Badge>
              </Group>

              <Center>
                <RingProgress
                  sections={[{ value: selectedResult.risk_score, color: getRiskColor(selectedResult.risk_score) }]}
                  label={<Text fw={700}>{selectedResult.risk_score}%</Text>}
                  size={110}
                />
              </Center>
            </Paper>

            {renderCheckSections(selectedResult)}
          </Stack>
        ) : null}
      </Modal>
    </Container>
  );
};

export default GitHubHealthCheck;
