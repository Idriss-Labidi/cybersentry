import {
  Alert,
  Badge,
  Center,
  Divider,
  Group,
  List,
  Paper,
  Progress,
  RingProgress,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconBug,
  IconCheck,
  IconCode,
  IconFileText,
  IconGitCommit,
  IconGitFork,
  IconLockOff,
  IconShield,
  IconStar,
  IconUsers,
  IconX,
} from '@tabler/icons-react';
import { formatBytes } from '../../utils/githubHealthUtils';

type WarningLevel = 'critical' | 'high' | 'medium' | 'low' | 'warning' | 'info';

type SecurityFileCheckItem = {
  exists?: boolean;
  size_bytes?: number;
};

type DependencyEntry =
  | string
  | {
      file_found?: boolean;
      lines?: number;
      has_pinned_versions?: boolean;
      suspicious_packages?: string[];
      has_lock_file?: boolean;
      file_size_kb?: number;
      uses_latest_tag?: boolean;
      has_security_warnings?: string[];
    };

type SuspiciousPattern =
  | string
  | {
      file?: string;
      pattern?: string;
      severity?: string;
    };

type GitHubCheckSectionsProps = {
  detail: {
    warnings?: Array<{
      level: WarningLevel | string;
      message: string;
      category: string;
    }>;
    recommendations?: string[];
    level1_data?: {
      releases?: { score?: number; has_releases?: boolean; release_count?: number };
      community?: {
        forks?: number;
        score?: number;
        stars?: number;
        bus_factor_risk?: string;
        total_contributors?: number;
      };
      maintenance?: {
        score?: number;
        status?: string;
        last_push_date?: string;
        days_since_last_commit?: number;
      };
      raw_metrics?: {
        forks?: number;
        stars?: number;
        language?: string;
        watchers?: number;
        open_issues?: number;
      };
      documentation?: {
        score?: number;
        checks?: {
          topics?: string[];
          has_homepage?: boolean;
          has_description?: boolean;
        };
      };
      security_basics?: {
        score?: number;
        checks?: {
          is_private?: boolean;
          has_license?: boolean;
          license_type?: string | null;
          has_vulnerability_alerts?: boolean;
        };
      };
      branch_protection?: {
        score?: number;
        branch_count?: number;
        default_branch_protected?: boolean;
      };
    };
    level2_data?: {
      dependencies?: Record<string, DependencyEntry>;
      security_file_check?: Record<string, SecurityFileCheckItem>;
      code_quality_signals?: {
        suspicious_code_patterns?: SuspiciousPattern[];
      };
    };
    level3_data?: {
      code_scanning?: {
        available?: boolean;
        message?: string;
        total_alerts?: number;
        by_severity?: Record<string, number>;
      };
      secret_scanning?: {
        available?: boolean;
        message?: string;
        total_secrets_found?: number;
        has_exposed_secrets?: boolean;
      };
      dependabot_alerts?: {
        available?: boolean;
        error?: string;
        message?: string;
        total_alerts?: number;
        by_severity?: Record<string, number>;
        has_critical?: boolean;
      };
    };
  };
};

const hasData = (value: unknown) =>
  Boolean(value) && (Array.isArray(value) ? value.length > 0 : Object.keys(value as Record<string, unknown>).length > 0);

const clampProgress = (value: number) => Math.max(0, Math.min(100, value));

const formatOptionalDate = (value?: string | null) => {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleDateString();
};

const getWarningColor = (level: string) => {
  if (level === 'critical' || level === 'high') {
    return 'red';
  }

  if (level === 'warning' || level === 'medium') {
    return 'yellow';
  }

  if (level === 'low') {
    return 'blue';
  }

  return 'gray';
};

const humanizeKey = (value: string) =>
  value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());

const renderSeverityBadges = (values?: Record<string, number>) => {
  if (!values || Object.keys(values).length === 0) {
    return <Text size="sm" c="dimmed">No severity breakdown available.</Text>;
  }

  return (
    <Group gap="xs">
      {Object.entries(values).map(([severity, count]) => (
        <Badge key={severity} variant="light">
          {severity}: {count}
        </Badge>
      ))}
    </Group>
  );
};

const normalizePattern = (pattern: SuspiciousPattern) => {
  if (typeof pattern === 'string') {
    return {
      title: pattern,
      subtitle: null as string | null,
      severity: null as string | null,
    };
  }

  const title = pattern.pattern ? humanizeKey(pattern.pattern) : pattern.file || 'Suspicious pattern';
  const subtitle = pattern.file ? `File: ${pattern.file}` : null;

  return {
    title,
    subtitle,
    severity: pattern.severity || null,
  };
};

const renderRingLabel = (value: number) => (
  <Text component="div" fw={700} ta="center" style={{ width: '100%' }}>
    {value}%
  </Text>
);

function GitHubCheckSections({ detail }: GitHubCheckSectionsProps) {
  const level1 = detail.level1_data;
  const level2 = detail.level2_data;
  const level3 = detail.level3_data;
  const dependencyEntries = Object.entries(level2?.dependencies ?? {});
  const securityFiles = Object.entries(level2?.security_file_check ?? {});
  const suspiciousPatterns = level2?.code_quality_signals?.suspicious_code_patterns ?? [];

  const availableLevels = [
    hasData(level1) ? 'level1' : null,
    hasData(level2) ? 'level2' : null,
    hasData(level3) ? 'level3' : null,
  ].filter(Boolean) as string[];

  const renderLevel1 = () => (
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
        <Stack gap="lg">
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
            <Paper p="md" radius="md" withBorder>
              <Group justify="space-between" mb="xs">
                <Text size="sm" c="dimmed">
                  <IconStar size={16} style={{ marginRight: 4 }} />
                  Stars
                </Text>
                <Text fw={700}>{level1?.raw_metrics?.stars ?? 0}</Text>
              </Group>
              <Progress value={clampProgress((level1?.raw_metrics?.stars ?? 0) * 5)} color="yellow" />
            </Paper>

            <Paper p="md" radius="md" withBorder>
              <Group justify="space-between" mb="xs">
                <Text size="sm" c="dimmed">
                  <IconGitFork size={16} style={{ marginRight: 4 }} />
                  Forks
                </Text>
                <Text fw={700}>{level1?.raw_metrics?.forks ?? 0}</Text>
              </Group>
              <Progress value={clampProgress((level1?.raw_metrics?.forks ?? 0) * 5)} color="blue" />
            </Paper>

            <Paper p="md" radius="md" withBorder>
              <Group justify="space-between" mb="xs">
                <Text size="sm" c="dimmed">
                  <IconUsers size={16} style={{ marginRight: 4 }} />
                  Contributors
                </Text>
                <Text fw={700}>{level1?.community?.total_contributors ?? 0}</Text>
              </Group>
              <Progress value={clampProgress((level1?.community?.total_contributors ?? 0) * 10)} color="grape" />
            </Paper>

            <Paper p="md" radius="md" withBorder>
              <Group justify="space-between" mb="xs">
                <Text size="sm" c="dimmed">
                  <IconBug size={16} style={{ marginRight: 4 }} />
                  Open Issues
                </Text>
                <Text fw={700}>{level1?.raw_metrics?.open_issues ?? 0}</Text>
              </Group>
              <Progress value={clampProgress((level1?.raw_metrics?.open_issues ?? 0) * 2)} color="red" />
            </Paper>

            <Paper p="md" radius="md" withBorder>
              <Group justify="space-between" mb="xs">
                <Text size="sm" c="dimmed">Releases</Text>
                <Badge>{level1?.releases?.release_count ?? 0}</Badge>
              </Group>
              <Text size="xs" c="dimmed">
                {level1?.releases?.has_releases ? 'Has releases' : 'No releases'}
              </Text>
            </Paper>

            <Paper p="md" radius="md" withBorder>
              <Group justify="space-between" mb="xs">
                <Text size="sm" c="dimmed">Language</Text>
                <Badge>{level1?.raw_metrics?.language || 'Unknown'}</Badge>
              </Group>
            </Paper>
          </SimpleGrid>

          <Divider />

          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            <Paper p="md" radius="md" withBorder>
              <Text fw={700} mb="md">Documentation Score</Text>
              <Group justify="space-between" align="center">
                <Center>
                  <RingProgress
                    sections={[{ value: level1?.documentation?.score ?? 0, color: 'blue' }]}
                    label={renderRingLabel(level1?.documentation?.score ?? 0)}
                    size={120}
                  />
                </Center>
                <Stack gap="xs" flex={1}>
                  {level1?.documentation?.checks?.has_description ? (
                    <Group gap={8}>
                      <IconCheck size={16} color="green" />
                      <Text size="sm">Has description</Text>
                    </Group>
                  ) : null}
                  {level1?.documentation?.checks?.has_homepage ? (
                    <Group gap={8}>
                      <IconCheck size={16} color="green" />
                      <Text size="sm">Has homepage</Text>
                    </Group>
                  ) : null}
                  {(level1?.documentation?.checks?.topics?.length ?? 0) > 0 ? (
                    <Group gap={8}>
                      <IconCheck size={16} color="green" />
                      <Text size="sm">Has topics</Text>
                    </Group>
                  ) : null}
                </Stack>
              </Group>
            </Paper>

            <Paper p="md" radius="md" withBorder>
              <Text fw={700} mb="md">Release Hygiene</Text>
              <Center>
                <RingProgress
                  sections={[{ value: level1?.releases?.score ?? 0, color: 'teal' }]}
                  label={renderRingLabel(level1?.releases?.score ?? 0)}
                  size={120}
                />
              </Center>
            </Paper>
          </SimpleGrid>
        </Stack>
      </Tabs.Panel>

      <Tabs.Panel value="community" pt="xl">
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          <Paper p="md" radius="md" withBorder>
            <Text fw={700} mb="md">Community Metrics</Text>
            <Stack gap="md">
              <Group justify="space-between">
                <Text size="sm">Stars</Text>
                <Text fw={700}>{level1?.community?.stars ?? level1?.raw_metrics?.stars ?? 0}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm">Forks</Text>
                <Text fw={700}>{level1?.community?.forks ?? level1?.raw_metrics?.forks ?? 0}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm">Total Contributors</Text>
                <Text fw={700}>{level1?.community?.total_contributors ?? 0}</Text>
              </Group>
              <Divider />
              <Group justify="space-between">
                <Text size="sm">Bus Factor Risk</Text>
                <Badge color={level1?.community?.bus_factor_risk === 'Critical' ? 'red' : 'orange'}>
                  {level1?.community?.bus_factor_risk || 'Unknown'}
                </Badge>
              </Group>
            </Stack>
          </Paper>

          <Paper p="md" radius="md" withBorder>
            <Text fw={700} mb="md">Community Score</Text>
            <Center>
              <RingProgress
                sections={[{ value: level1?.community?.score ?? 0, color: 'violet' }]}
                label={renderRingLabel(level1?.community?.score ?? 0)}
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
                    level1?.maintenance?.status === 'Active'
                      ? 'green'
                      : level1?.maintenance?.status === 'Stale'
                      ? 'yellow'
                      : 'red'
                  }
                >
                  {level1?.maintenance?.status || 'Unknown'}
                </Badge>
              </Group>
              <Group justify="space-between">
                <Text size="sm">Days Since Last Commit</Text>
                <Text fw={700}>{level1?.maintenance?.days_since_last_commit ?? 'N/A'}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm">Last Push</Text>
                <Text size="sm">{formatOptionalDate(level1?.maintenance?.last_push_date)}</Text>
              </Group>
            </Stack>
          </Paper>

          <Paper p="md" radius="md" withBorder>
            <Text fw={700} mb="md">Maintenance Score</Text>
            <Center>
              <RingProgress
                sections={[{ value: level1?.maintenance?.score ?? 0, color: 'cyan' }]}
                label={renderRingLabel(level1?.maintenance?.score ?? 0)}
                size={120}
              />
            </Center>
          </Paper>
        </SimpleGrid>
      </Tabs.Panel>

      <Tabs.Panel value="security" pt="xl">
        <Stack gap="lg">
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            <Paper p="md" radius="md" withBorder>
              <Text fw={700} mb="md">Security Basics</Text>
              <Stack gap="md">
                <Group gap={8}>
                  {level1?.security_basics?.checks?.is_private ? (
                    <IconCheck size={16} color="green" />
                  ) : (
                    <IconLockOff size={16} color="red" />
                  )}
                  <Text size="sm">
                    {level1?.security_basics?.checks?.is_private ? 'Private' : 'Public'} repository
                  </Text>
                </Group>

                <Group gap={8}>
                  {level1?.security_basics?.checks?.has_license ? (
                    <IconCheck size={16} color="green" />
                  ) : (
                    <IconX size={16} color="red" />
                  )}
                  <Text size="sm">
                    {level1?.security_basics?.checks?.has_license
                      ? `License: ${level1?.security_basics?.checks?.license_type || 'Detected'}`
                      : 'No license'}
                  </Text>
                </Group>

                <Group gap={8}>
                  {level1?.security_basics?.checks?.has_vulnerability_alerts ? (
                    <IconAlertTriangle size={16} color="orange" />
                  ) : (
                    <IconCheck size={16} color="green" />
                  )}
                  <Text size="sm">
                    {level1?.security_basics?.checks?.has_vulnerability_alerts
                      ? 'Has vulnerability alerts'
                      : 'No vulnerability alerts'}
                  </Text>
                </Group>
              </Stack>
            </Paper>

            <Paper p="md" radius="md" withBorder>
              <Text fw={700} mb="md">Security Score</Text>
              <Center>
                <RingProgress
                  sections={[{ value: level1?.security_basics?.score ?? 0, color: 'red' }]}
                  label={renderRingLabel(level1?.security_basics?.score ?? 0)}
                  size={120}
                />
              </Center>
            </Paper>
          </SimpleGrid>

          <Paper p="md" radius="md" withBorder>
            <Text fw={700} mb="md">Branch Protection</Text>
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
              <Group justify="space-between">
                <Text size="sm">Total Branches</Text>
                <Text fw={700}>{level1?.branch_protection?.branch_count ?? 0}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm">Default Branch Protected</Text>
                <Badge color={level1?.branch_protection?.default_branch_protected ? 'green' : 'red'}>
                  {level1?.branch_protection?.default_branch_protected ? 'Yes' : 'No'}
                </Badge>
              </Group>
            </SimpleGrid>
            <Progress value={level1?.branch_protection?.score ?? 0} mt="md" />
          </Paper>
        </Stack>
      </Tabs.Panel>
    </Tabs>
  );

  const renderLevel2 = () => (
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
        {securityFiles.length > 0 ? (
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            {securityFiles.map(([filename, fileData]) => (
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
                {fileData.exists && (fileData.size_bytes ?? 0) > 0 ? (
                  <Text size="xs" c="dimmed">
                    Size: {formatBytes(fileData.size_bytes ?? 0)}
                  </Text>
                ) : null}
              </Paper>
            ))}
          </SimpleGrid>
        ) : (
          <Text size="sm" c="dimmed">No file inspection data available.</Text>
        )}
      </Tabs.Panel>

      <Tabs.Panel value="dependencies" pt="xl">
        {dependencyEntries.length > 0 ? (
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            {dependencyEntries.map(([name, dependency]) => (
              <Paper key={name} p="md" radius="md" withBorder>
                <Text fw={700} mb="md">{humanizeKey(name)}</Text>
                {typeof dependency === 'string' ? (
                  <Text size="sm">{dependency}</Text>
                ) : (
                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Text size="sm">File found</Text>
                      <Badge color={dependency.file_found ? 'green' : 'red'}>
                        {dependency.file_found ? 'Yes' : 'No'}
                      </Badge>
                    </Group>
                    {dependency.lines !== undefined ? (
                      <Group justify="space-between">
                        <Text size="sm">Lines</Text>
                        <Text size="sm" fw={700}>{dependency.lines}</Text>
                      </Group>
                    ) : null}
                    {dependency.has_pinned_versions !== undefined ? (
                      <Group justify="space-between">
                        <Text size="sm">Pinned versions</Text>
                        <Badge color={dependency.has_pinned_versions ? 'green' : 'yellow'}>
                          {dependency.has_pinned_versions ? 'Mostly pinned' : 'Loose'}
                        </Badge>
                      </Group>
                    ) : null}
                    {dependency.has_lock_file !== undefined ? (
                      <Group justify="space-between">
                        <Text size="sm">Lock file</Text>
                        <Badge color={dependency.has_lock_file ? 'green' : 'yellow'}>
                          {dependency.has_lock_file ? 'Present' : 'Missing'}
                        </Badge>
                      </Group>
                    ) : null}
                    {dependency.file_size_kb !== undefined ? (
                      <Group justify="space-between">
                        <Text size="sm">File size</Text>
                        <Text size="sm" fw={700}>{dependency.file_size_kb.toFixed(2)} KB</Text>
                      </Group>
                    ) : null}
                    {dependency.uses_latest_tag !== undefined ? (
                      <Group justify="space-between">
                        <Text size="sm">Uses latest tag</Text>
                        <Badge color={dependency.uses_latest_tag ? 'red' : 'green'}>
                          {dependency.uses_latest_tag ? 'Yes' : 'No'}
                        </Badge>
                      </Group>
                    ) : null}
                    {(dependency.suspicious_packages?.length ?? 0) > 0 ? (
                      <List size="sm" icon={<IconAlertTriangle size={14} color="orange" />}>
                        {dependency.suspicious_packages?.map((item) => (
                          <List.Item key={item}>{item}</List.Item>
                        ))}
                      </List>
                    ) : null}
                    {(dependency.has_security_warnings?.length ?? 0) > 0 ? (
                      <List size="sm" icon={<IconAlertTriangle size={14} color="orange" />}>
                        {dependency.has_security_warnings?.map((item) => (
                          <List.Item key={item}>{item}</List.Item>
                        ))}
                      </List>
                    ) : null}
                  </Stack>
                )}
              </Paper>
            ))}
          </SimpleGrid>
        ) : (
          <Text size="sm" c="dimmed">No dependency data available.</Text>
        )}
      </Tabs.Panel>

      <Tabs.Panel value="quality" pt="xl">
        <Paper p="md" radius="md" withBorder>
          <Text fw={700} mb="md">Code Quality Signals</Text>
          {suspiciousPatterns.length > 0 ? (
            <List icon={<IconAlertTriangle size={16} color="orange" />}>
              {suspiciousPatterns.map((pattern, index) => {
                const normalized = normalizePattern(pattern);
                return (
                  <List.Item key={`${normalized.title}-${index}`}>
                    <Text fw={600}>{normalized.title}</Text>
                    {normalized.subtitle ? (
                      <Text size="sm" c="dimmed">{normalized.subtitle}</Text>
                    ) : null}
                    {normalized.severity ? (
                      <Badge mt={6} variant="light" color={normalized.severity === 'high' ? 'red' : 'yellow'}>
                        {normalized.severity}
                      </Badge>
                    ) : null}
                  </List.Item>
                );
              })}
            </List>
          ) : (
            <Group gap={8}>
              <IconCheck size={16} color="green" />
              <Text size="sm">No suspicious code patterns detected.</Text>
            </Group>
          )}
        </Paper>
      </Tabs.Panel>
    </Tabs>
  );

  const renderLevel3 = () => (
    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
      <Paper p="md" radius="md" withBorder>
        <Group justify="space-between" mb="sm">
          <Text fw={700}>Code Scanning</Text>
          <Badge color={level3?.code_scanning?.available ? 'green' : 'gray'}>
            {level3?.code_scanning?.available ? 'Available' : 'Not Available'}
          </Badge>
        </Group>
        <Stack gap="xs">
          <Text size="sm" c="dimmed">
            {level3?.code_scanning?.available
              ? `${level3?.code_scanning?.total_alerts ?? 0} alert(s) found`
              : level3?.code_scanning?.message || 'Code scanning is not available.'}
          </Text>
          {renderSeverityBadges(level3?.code_scanning?.by_severity)}
        </Stack>
      </Paper>

      <Paper p="md" radius="md" withBorder>
        <Group justify="space-between" mb="sm">
          <Text fw={700}>Secret Scanning</Text>
          <Badge color={level3?.secret_scanning?.available ? 'green' : 'gray'}>
            {level3?.secret_scanning?.available ? 'Available' : 'Not Available'}
          </Badge>
        </Group>
        <Stack gap="xs">
          <Text size="sm" c="dimmed">
            {level3?.secret_scanning?.available
              ? `${level3?.secret_scanning?.total_secrets_found ?? 0} exposed secret(s)`
              : level3?.secret_scanning?.message || 'Secret scanning is not available.'}
          </Text>
          {level3?.secret_scanning?.has_exposed_secrets ? (
            <Badge color="red" variant="light">Exposed secrets detected</Badge>
          ) : null}
        </Stack>
      </Paper>

      <Paper p="md" radius="md" withBorder>
        <Group justify="space-between" mb="sm">
          <Text fw={700}>Dependabot Alerts</Text>
          <Badge color={level3?.dependabot_alerts?.available ? 'green' : 'gray'}>
            {level3?.dependabot_alerts?.available ? 'Available' : 'Not Available'}
          </Badge>
        </Group>
        <Stack gap="xs">
          <Text size="sm" c="dimmed">
            {level3?.dependabot_alerts?.available
              ? `${level3?.dependabot_alerts?.total_alerts ?? 0} alert(s) found`
              : level3?.dependabot_alerts?.message || 'Dependabot alerts are not available.'}
          </Text>
          {renderSeverityBadges(level3?.dependabot_alerts?.by_severity)}
          {level3?.dependabot_alerts?.has_critical ? (
            <Badge color="red" variant="light">Critical vulnerabilities detected</Badge>
          ) : null}
          {level3?.dependabot_alerts?.error ? (
            <Alert icon={<IconAlertCircle size={16} />} color="yellow" variant="light">
              {level3.dependabot_alerts.error}
            </Alert>
          ) : null}
        </Stack>
      </Paper>
    </SimpleGrid>
  );

  return (
    <Stack gap="lg">
      {availableLevels.length > 0 ? (
        <Tabs defaultValue={availableLevels[0]}>
          <Tabs.List>
            {hasData(level1) ? (
              <Tabs.Tab value="level1" leftSection={<IconShield size={14} />}>
                Level 1: REST API
              </Tabs.Tab>
            ) : null}
            {hasData(level2) ? (
              <Tabs.Tab value="level2" leftSection={<IconFileText size={14} />}>
                Level 2: Files
              </Tabs.Tab>
            ) : null}
            {hasData(level3) ? (
              <Tabs.Tab value="level3" leftSection={<IconShield size={14} />}>
                Level 3: Security
              </Tabs.Tab>
            ) : null}
          </Tabs.List>

          {hasData(level1) ? <Tabs.Panel value="level1" pt="xl">{renderLevel1()}</Tabs.Panel> : null}
          {hasData(level2) ? <Tabs.Panel value="level2" pt="xl">{renderLevel2()}</Tabs.Panel> : null}
          {hasData(level3) ? <Tabs.Panel value="level3" pt="xl">{renderLevel3()}</Tabs.Panel> : null}
        </Tabs>
      ) : (
        <Text size="sm" c="dimmed">
          No structured level data was returned for this check.
        </Text>
      )}

      {detail.warnings && detail.warnings.length > 0 ? (
        <Paper p="lg" radius="md" withBorder>
          <Text fw={700} mb="md">Warnings and issues</Text>
          <Stack gap="sm">
            {detail.warnings.map((warning, index) => (
              <Alert
                key={`${warning.category}-${index}`}
                icon={<IconAlertTriangle size={16} />}
                color={getWarningColor(warning.level)}
                title={warning.category}
              >
                {warning.message}
              </Alert>
            ))}
          </Stack>
        </Paper>
      ) : null}

      {detail.recommendations && detail.recommendations.length > 0 ? (
        <Paper p="lg" radius="md" withBorder>
          <Text fw={700} mb="md">Recommendations</Text>
          <List icon={<IconCheck size={16} color="green" />}>
            {detail.recommendations.map((recommendation) => (
              <List.Item key={recommendation}>{recommendation}</List.Item>
            ))}
          </List>
        </Paper>
      ) : null}
    </Stack>
  );
}

export default GitHubCheckSections;
