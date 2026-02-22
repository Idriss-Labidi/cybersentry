import React, { useState } from 'react';
import {
  Container,
  Title,
  Text,
  TextInput,
  MultiSelect,
  Button,
  Card,
  Group,
  Stack,
  Divider,
  Badge,
  Progress,
  Tooltip,
  Alert,
  SimpleGrid,
  Paper,
  RingProgress,
  Center,
  Table,
  Tabs,
  List,
} from '@mantine/core';
import {
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconUsers,
  IconShield,
  IconFileText,
  IconCode,
  IconGitCommit,
  IconSearch,
  IconAlertCircle,
  IconLockOff,
  IconGitFork,
  IconStar,
  IconBug,
} from '@tabler/icons-react';
import axios, { AxiosError } from 'axios';
import { getRiskColor, getRiskLabel } from '../utils/githubHealthUtils';
import { useAuth } from '../context/AuthContext';

type WarningLevel = 'critical' | 'high' | 'medium' | 'low' | 'warning' | 'info';

interface RepositoryInfo {
  id: number;
  owner: string;
  name: string;
  url: string;
  organization: number;
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
  dependencies?: Record<string, string>;
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

interface CheckResult {
  message: string;
  result: {
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
  };
}

const GitHubHealthCheck = () => {
  const { user } = useAuth();
  const [url, setUrl] = useState('');
  const [levels, setLevels] = useState<string[]>(['1', '2', '3']);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [useCache, setUseCache] = useState(true);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      setError('Please enter a GitHub repository URL');
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
      const response = await axios.post<CheckResult>(
        'http://localhost:8000/github-health/check_repository/',
        {
          url: url.trim(),
          levels,
          use_cache: useCache,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setResult(response.data);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ error?: string }>;
      setError(axiosError.response?.data?.error ?? 'Failed to check repository');
    } finally {
      setLoading(false);
    }
  };

  const renderLevel1Data = (data: Level1Data | undefined) => {
    if (!data) return null;
    return (
      <Tabs defaultValue="overview">
        <Tabs.List>
          <Tabs.Tab value="overview" leftSection={<IconShield size={14} />}>
            Overview
          </Tabs.Tab>
          <Tabs.Tab value="community" leftSection={<IconUsers size={14} />}>
            Community
          </Tabs.Tab>
          <Tabs.Tab value="maintenance" leftSection={<IconGitCommit size={14} />}>
            Maintenance
          </Tabs.Tab>
          <Tabs.Tab value="security" leftSection={<IconShield size={14} />}>
            Security Basics
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="overview" pt="xl">
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
            <Paper p="md" radius="md" withBorder>
              <Group justify="space-between" mb="xs">
                <Text size="sm" c="dimmed">
                  <IconStar size={16} style={{ marginRight: 4 }} />
                  Stars
                </Text>
                <Text fw={700}>{data.raw_metrics?.stars || 0}</Text>
              </Group>
              <Progress value={(data.raw_metrics?.stars || 0) * 5} color="yellow" />
            </Paper>

            <Paper p="md" radius="md" withBorder>
              <Group justify="space-between" mb="xs">
                <Text size="sm" c="dimmed">
                  <IconGitFork size={16} style={{ marginRight: 4 }} />
                  Forks
                </Text>
                <Text fw={700}>{data.raw_metrics?.forks || 0}</Text>
              </Group>
              <Progress value={(data.raw_metrics?.forks || 0) * 5} color="blue" />
            </Paper>

            <Paper p="md" radius="md" withBorder>
              <Group justify="space-between" mb="xs">
                <Text size="sm" c="dimmed">
                  <IconUsers size={16} style={{ marginRight: 4 }} />
                  Contributors
                </Text>
                <Text fw={700}>{data.community?.total_contributors || 0}</Text>
              </Group>
              <Progress value={Math.min((data.community?.total_contributors || 0) * 10, 100)} color="grape" />
            </Paper>

            <Paper p="md" radius="md" withBorder>
              <Group justify="space-between" mb="xs">
                <Text size="sm" c="dimmed">
                  <IconBug size={16} style={{ marginRight: 4 }} />
                  Open Issues
                </Text>
                <Text fw={700}>{data.raw_metrics?.open_issues || 0}</Text>
              </Group>
              <Progress value={Math.min((data.raw_metrics?.open_issues || 0) * 2, 100)} color="red" />
            </Paper>

            <Paper p="md" radius="md" withBorder>
              <Group justify="space-between" mb="xs">
                <Text size="sm" c="dimmed">
                  Releases
                </Text>
                <Badge>{data.releases?.release_count || 0}</Badge>
              </Group>
              <Text size="xs" c="dimmed">
                {data.releases?.has_releases ? 'Has releases' : 'No releases'}
              </Text>
            </Paper>

            <Paper p="md" radius="md" withBorder>
              <Group justify="space-between" mb="xs">
                <Text size="sm" c="dimmed">
                  Language
                </Text>
                <Badge>{data.raw_metrics?.language || 'Unknown'}</Badge>
              </Group>
            </Paper>
          </SimpleGrid>

          <Divider my="lg" />

          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            <Paper p="md" radius="md" withBorder>
              <Text fw={700} mb="md">Documentation Score</Text>
              <Group justify="space-between" mb="md">
                <Center>
                  <RingProgress
                    sections={[{ value: data.documentation?.score || 0, color: 'blue' }]}
                    label={
                      <div>
                        <Text fw={700} ta="center">
                          {data.documentation?.score || 0}%
                        </Text>
                      </div>
                    }
                    size={120}
                  />
                </Center>
                <Stack gap="xs" flex={1}>
                  {data.documentation?.checks?.has_description && (
                    <Group gap={8}>
                      <IconCheck size={16} color="green" />
                      <Text size="sm">Has description</Text>
                    </Group>
                  )}
                  {data.documentation?.checks?.has_homepage && (
                    <Group gap={8}>
                      <IconCheck size={16} color="green" />
                      <Text size="sm">Has homepage</Text>
                    </Group>
                  )}
                  {data.documentation?.checks?.topics && data.documentation.checks.topics.length > 0 && (
                    <Group gap={8}>
                      <IconCheck size={16} color="green" />
                      <Text size="sm">Has topics</Text>
                    </Group>
                  )}
                </Stack>
              </Group>
            </Paper>

            <Paper p="md" radius="md" withBorder>
              <Text fw={700} mb="md">Releases Score</Text>
              <Center>
                <RingProgress
                  sections={[{ value: data.releases?.score || 0, color: 'teal' }]}
                  label={
                    <div>
                      <Text fw={700} ta="center">
                        {data.releases?.score || 0}%
                      </Text>
                    </div>
                  }
                  size={120}
                />
              </Center>
            </Paper>
          </SimpleGrid>
        </Tabs.Panel>

        <Tabs.Panel value="community" pt="xl">
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            <Paper p="md" radius="md" withBorder>
              <Text fw={700} mb="md">Community Metrics</Text>
              <Stack gap="md">
                <Group justify="space-between">
                  <Text size="sm">Stars</Text>
                  <Text fw={700}>{data.community?.stars || 0}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">Forks</Text>
                  <Text fw={700}>{data.community?.forks || 0}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">Total Contributors</Text>
                  <Text fw={700}>{data.community?.total_contributors || 0}</Text>
                </Group>
                <Divider />
                <Group justify="space-between">
                  <Text size="sm">Bus Factor Risk</Text>
                  <Badge color={data.community?.bus_factor_risk === 'Critical' ? 'red' : 'orange'}>
                    {data.community?.bus_factor_risk}
                  </Badge>
                </Group>
              </Stack>
            </Paper>

            <Paper p="md" radius="md" withBorder>
              <Text fw={700} mb="md">Community Score: {data.community?.score}%</Text>
              <Center>
                <RingProgress
                  sections={[{ value: data.community?.score || 0, color: 'violet' }]}
                  label={
                    <div>
                      <Text fw={700} ta="center">
                        {data.community?.score || 0}%
                      </Text>
                    </div>
                  }
                  size={120}
                />
              </Center>
            </Paper>
          </SimpleGrid>
        </Tabs.Panel>

        <Tabs.Panel value="maintenance" pt="xl">
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            <Paper p="md" radius="md" withBorder>
              <Text fw={700} mb="md">Maintenance Status</Text>
              <Stack gap="md">
                <Group justify="space-between">
                  <Text size="sm">Status</Text>
                  <Badge
                    color={
                      data.maintenance?.status === 'Active'
                        ? 'green'
                        : data.maintenance?.status === 'Stale'
                        ? 'yellow'
                        : 'red'
                    }
                  >
                    {data.maintenance?.status}
                  </Badge>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">Days Since Last Commit</Text>
                  <Text fw={700}>{data.maintenance?.days_since_last_commit || 0}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">Last Push</Text>
                  <Text size="sm">{new Date(data.maintenance!.last_push_date).toLocaleDateString()}</Text>
                </Group>
              </Stack>
            </Paper>

            <Paper p="md" radius="md" withBorder>
              <Text fw={700} mb="md">Maintenance Score: {data.maintenance?.score}%</Text>
              <Center>
                <RingProgress
                  sections={[{ value: data.maintenance?.score || 0, color: 'cyan' }]}
                  label={
                    <div>
                      <Text fw={700} ta="center">
                        {data.maintenance?.score || 0}%
                      </Text>
                    </div>
                  }
                  size={120}
                />
              </Center>
            </Paper>
          </SimpleGrid>
        </Tabs.Panel>

        <Tabs.Panel value="security" pt="xl">
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            <Paper p="md" radius="md" withBorder>
              <Text fw={700} mb="md">Security Basics</Text>
              <Stack gap="md">
                <Group gap={8}>
                  {data.security_basics?.checks?.is_private ? (
                    <IconCheck size={16} color="green" />
                  ) : (
                    <IconLockOff size={16} color="red" />
                  )}
                  <Text size="sm">
                    {data.security_basics?.checks?.is_private ? 'Private' : 'Public'} repository
                  </Text>
                </Group>

                <Group gap={8}>
                  {data.security_basics?.checks?.has_license ? (
                    <IconCheck size={16} color="green" />
                  ) : (
                    <IconX size={16} color="red" />
                  )}
                  <Text size="sm">
                    {data.security_basics?.checks?.has_license
                      ? `License: ${data.security_basics.checks.license_type}`
                      : 'No license'}
                  </Text>
                </Group>

                <Group gap={8}>
                  {data.security_basics?.checks?.has_vulnerability_alerts ? (
                    <IconAlertTriangle size={16} color="orange" />
                  ) : (
                    <IconCheck size={16} color="green" />
                  )}
                  <Text size="sm">
                    {data.security_basics?.checks?.has_vulnerability_alerts
                      ? 'Has vulnerability alerts'
                      : 'No vulnerability alerts'}
                  </Text>
                </Group>
              </Stack>
            </Paper>

            <Paper p="md" radius="md" withBorder>
              <Text fw={700} mb="md">Security Score: {data.security_basics?.score}%</Text>
              <Center>
                <RingProgress
                  sections={[{ value: data.security_basics?.score || 0, color: 'red' }]}
                  label={
                    <div>
                      <Text fw={700} ta="center">
                        {data.security_basics?.score || 0}%
                      </Text>
                    </div>
                  }
                  size={120}
                />
              </Center>
            </Paper>
          </SimpleGrid>

          <Divider my="lg" />

          <Paper p="md" radius="md" withBorder>
            <Text fw={700} mb="md">Branch Protection</Text>
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
              <Group justify="space-between">
                <Text size="sm">Total Branches</Text>
                <Text fw={700}>{data.branch_protection?.branch_count || 0}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm">Default Branch Protected</Text>
                <Badge color={data.branch_protection?.default_branch_protected ? 'green' : 'red'}>
                  {data.branch_protection?.default_branch_protected ? 'Yes' : 'No'}
                </Badge>
              </Group>
            </SimpleGrid>
            <Progress
              value={data.branch_protection?.score || 0}
              mt="md"
            />
          </Paper>
        </Tabs.Panel>
      </Tabs>
    );
  };

  const renderLevel2Data = (data: Level2Data | undefined) => {
    if (!data) return null;
    return (
      <Tabs defaultValue="files">
        <Tabs.List>
          <Tabs.Tab value="files" leftSection={<IconFileText size={14} />}>
            Files
          </Tabs.Tab>
          <Tabs.Tab value="dependencies" leftSection={<IconCode size={14} />}>
            Dependencies
          </Tabs.Tab>
          <Tabs.Tab value="quality" leftSection={<IconShield size={14} />}>
            Code Quality
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="files" pt="xl">
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            {Object.entries(data.security_file_check || {}).map(([filename, fileData]) => (
              <Paper key={filename} p="md" radius="md" withBorder>
                <Group justify="space-between" mb="sm">
                  <Text size="sm" fw={700}>
                    {filename}
                  </Text>
                  {fileData.exists ? (
                    <Group gap={4}>
                      <IconCheck size={16} color="green" />
                      <Text size="xs" c="green">
                        Exists
                      </Text>
                    </Group>
                  ) : (
                    <Group gap={4}>
                      <IconX size={16} color="red" />
                      <Text size="xs" c="red">
                        Missing
                      </Text>
                    </Group>
                  )}
                </Group>
                {fileData.exists && fileData.size_bytes > 0 && (
                  <Text size="xs" c="dimmed">
                    Size: {(fileData.size_bytes / 1024).toFixed(2)} KB
                  </Text>
                )}
              </Paper>
            ))}
          </SimpleGrid>
        </Tabs.Panel>

        <Tabs.Panel value="dependencies" pt="xl">
          <Paper p="md" radius="md" withBorder>
            <Text size="sm" c="dimmed">
              {Object.keys(data.dependencies || {}).length > 0
                ? 'Dependencies detected'
                : 'No dependency data available'}
            </Text>
            {Object.keys(data.dependencies || {}).length > 0 && (
              <Table mt="md">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Package</Table.Th>
                    <Table.Th>Version</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {Object.entries(data.dependencies!).map(([name, version]) => (
                    <Table.Tr key={name}>
                      <Table.Td>{name}</Table.Td>
                      <Table.Td>{version}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="quality" pt="xl">
          <Paper p="md" radius="md" withBorder>
            <Text fw={700} mb="md">
              Code Quality Signals
            </Text>
            {data.code_quality_signals!.suspicious_code_patterns?.length > 0 ? (
              <List icon={<IconAlertTriangle size={16} color="orange" />}>
                {data.code_quality_signals!.suspicious_code_patterns.map((pattern, idx) => (
                  <List.Item key={`${pattern}-${idx}`}>{pattern}</List.Item>
                ))}
              </List>
            ) : (
              <Group gap={8}>
                <IconCheck size={16} color="green" />
                <Text size="sm">No suspicious code patterns detected</Text>
              </Group>
            )}
          </Paper>
        </Tabs.Panel>
      </Tabs>
    );
  };

  const renderLevel3Data = (data: Level3Data | undefined) => {
    if (!data) return null;
    return (
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        <Paper p="md" radius="md" withBorder>
          <Group justify="space-between" mb="sm">
            <Text fw={700}>Code Scanning</Text>
            {data.code_scanning?.available ? (
              <Badge color="green">Available</Badge>
            ) : (
              <Badge color="gray">Not Available</Badge>
            )}
          </Group>
          <Text size="sm" c="dimmed">
            {data.code_scanning?.available ? 'Code scanning is enabled' : 'Code scanning is not available'}
          </Text>
        </Paper>

        <Paper p="md" radius="md" withBorder>
          <Group justify="space-between" mb="sm">
            <Text fw={700}>Secret Scanning</Text>
            {data.secret_scanning?.available ? (
              <Badge color="green">Available</Badge>
            ) : (
              <Badge color="gray">Not Available</Badge>
            )}
          </Group>
          <Text size="sm" c="dimmed">
            {data.secret_scanning?.available ? 'Secret scanning is enabled' : 'Secret scanning is not available'}
          </Text>
        </Paper>

        <Paper p="md" radius="md" withBorder>
          <Group justify="space-between" mb="sm">
            <Text fw={700}>Dependabot Alerts</Text>
            {data.dependabot_alerts?.available ? (
              <Badge color="green">Available</Badge>
            ) : (
              <Badge color="gray">Not Available</Badge>
            )}
          </Group>
          {data.dependabot_alerts?.error && (
            <Alert icon={<IconAlertCircle size={16} />} color="yellow" mt="sm">
              {data.dependabot_alerts.error}
            </Alert>
          )}
        </Paper>
      </SimpleGrid>
    );
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={1} mb="sm">
            GitHub Repository Health Check
          </Title>
          <Text c="dimmed">
            Analyze your GitHub repositories for security, maintenance, and community health metrics
          </Text>
        </div>

        {/* Input Form */}
        <Card withBorder radius="md" padding="lg" bg="var(--mantine-color-gray-0)">
          <form onSubmit={handleCheck}>
            <Stack gap="md">
              <TextInput
                label="GitHub Repository URL"
                placeholder="https://github.com/owner/repo"
                value={url}
                onChange={(e) => setUrl(e.currentTarget.value)}
                description="Enter the full GitHub repository URL"
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
                maxDropdownHeight={160}
              />

              <Group justify="space-between">
                <Text size="sm">
                  <Tooltip label="Use cached results from less than 1 hour ago">
                    <span>Use cached results</span>
                  </Tooltip>
                </Text>
                <Button
                  variant={useCache ? 'default' : 'light'}
                  size="xs"
                  onClick={() => setUseCache(!useCache)}
                >
                  {useCache ? 'Enabled' : 'Disabled'}
                </Button>
              </Group>

              <Button
                type="submit"
                fullWidth
                size="md"
                loading={loading}
                leftSection={<IconSearch size={16} />}
              >
                {loading ? 'Checking Repository...' : 'Check Repository'}
              </Button>
            </Stack>
          </form>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" title="Error">
            {error}
          </Alert>
        )}

        {/* Results */}
        {result && (
          <Stack gap="xl">
            {/* Message */}
            {result.message && (
              <Alert icon={<IconCheck size={16} />} color="blue">
                {result.message}
              </Alert>
            )}

            {/* Repository Header */}
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
                <Stack gap={0} align="flex-end">
                  <Badge size="lg" color={getRiskColor(result.result.risk_score)}>
                    {getRiskLabel(result.result.risk_score)}
                  </Badge>
                  <Text size="sm" c="dimmed" mt={8}>
                    Score: {result.result.risk_score}/100
                  </Text>
                </Stack>
              </Group>

              <Divider my="md" />

              <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md" mb="md">
                <Paper p="sm" radius="sm" bg="gray.0">
                  <Text size="xs" c="dimmed" mb={4}>
                    Repository Created
                  </Text>
                  <Text size="sm" fw={700}>
                    {new Date(result.result.repository.created_at).toLocaleDateString()}
                  </Text>
                </Paper>

                <Paper p="sm" radius="sm" bg="gray.0">
                  <Text size="xs" c="dimmed" mb={4}>
                    Last Check
                  </Text>
                  <Text size="sm" fw={700}>
                    {new Date(result.result.check_timestamp).toLocaleString()}
                  </Text>
                </Paper>

                <Paper p="sm" radius="sm" bg="gray.0">
                  <Text size="xs" c="dimmed" mb={4}>
                    Risk Assessment
                  </Text>
                  <Text size="sm" fw={700}>
                    {result.result.summary}
                  </Text>
                </Paper>
              </SimpleGrid>

              {/* Risk Score Visualization */}
              <Center my="lg">
                <RingProgress
                  sections={[
                    {
                      value: result.result.risk_score,
                      color: getRiskColor(result.result.risk_score),
                    },
                  ]}
                  label={
                    <div>
                      <Text fw={700} ta="center" size="xl">
                        {result.result.risk_score}%
                      </Text>
                      <Text size="xs" ta="center" c="dimmed">
                        Risk Score
                      </Text>
                    </div>
                  }
                  size={140}
                />
              </Center>
            </Paper>

            {/* Warnings */}
            {result.result.warnings && result.result.warnings.length > 0 && (
              <Card withBorder radius="md" padding="lg">
                <Title order={3} mb="md">
                  ⚠️ Warnings & Issues
                </Title>
                <Stack gap="sm">
                  {result.result.warnings.map((warning, idx) => (
                    <Alert
                      key={`${warning.category}-${idx}`}
                      icon={<IconAlertTriangle size={16} />}
                      color={warning.level === 'critical' ? 'red' : warning.level === 'warning' ? 'yellow' : 'orange'}
                      title={warning.category}
                    >
                      {warning.message}
                    </Alert>
                  ))}
                </Stack>
              </Card>
            )}

            {/* Recommendations */}
            {result.result.recommendations && result.result.recommendations.length > 0 && (
              <Card withBorder radius="md" padding="lg">
                <Title order={3} mb="md">
                  💡 Recommendations
                </Title>
                <List icon={<IconCheck size={16} color="green" />} spacing="md">
                  {result.result.recommendations.map((rec, idx) => (
                    <List.Item key={`${rec}-${idx}`}>{rec}</List.Item>
                  ))}
                </List>
              </Card>
            )}

            <Tabs defaultValue="level1">
              <Tabs.List>
                {levels.includes('1') && (
                  <Tabs.Tab value="level1" leftSection={<IconShield size={14} />}>
                    Level 1: REST API
                  </Tabs.Tab>
                )}
                {levels.includes('2') && (
                  <Tabs.Tab value="level2" leftSection={<IconFileText size={14} />}>
                    Level 2: Files
                  </Tabs.Tab>
                )}
                {levels.includes('3') && (
                  <Tabs.Tab value="level3" leftSection={<IconShield size={14} />}>
                    Level 3: Security
                  </Tabs.Tab>
                )}
              </Tabs.List>

              {levels.includes('1') && (
                <Tabs.Panel value="level1" pt="xl">
                  {renderLevel1Data(result.result.level1_data)}
                </Tabs.Panel>
              )}

              {levels.includes('2') && (
                <Tabs.Panel value="level2" pt="xl">
                  {renderLevel2Data(result.result.level2_data)}
                </Tabs.Panel>
              )}

              {levels.includes('3') && (
                <Tabs.Panel value="level3" pt="xl">
                  {renderLevel3Data(result.result.level3_data)}
                </Tabs.Panel>
              )}
            </Tabs>
          </Stack>
        )}
      </Stack>
    </Container>
  );
};

export default GitHubHealthCheck;

