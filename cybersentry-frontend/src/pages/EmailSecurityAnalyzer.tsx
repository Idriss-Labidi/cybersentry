import { useState } from 'react';
import {
  Container, Title, Text, TextInput, Button, Paper, Stack, Group,
  LoadingOverlay, Alert, Badge, Divider, Progress, ThemeIcon,
  RingProgress, Accordion, List, Center, Tabs, Code, Table,
  Tooltip, CopyButton, ActionIcon,
} from '@mantine/core';
import {
  IconMailCheck, IconAlertCircle, IconSearch, IconCircleCheck,
  IconCircleX, IconAlertTriangle, IconShieldLock, IconKey,
  IconMailForward, IconCopy, IconCheck,
} from '@tabler/icons-react';
import {
  emailSecurityAnalysis,
  type EmailSecurityResponse,
  type SPFResult,
  type DKIMResult,
  type DMARCResult,
  type Recommendation,
} from '../services/email-tools';

const gradeColor = (grade: string) => {
  switch (grade) {
    case 'A': return 'green';
    case 'B': return 'teal';
    case 'C': return 'yellow';
    case 'D': return 'orange';
    case 'F': return 'red';
    default:  return 'gray';
  }
};

const statusColor = (s: string) => {
  switch (s) {
    case 'OK':      return 'green';
    case 'WARNING': return 'yellow';
    case 'MISSING': return 'red';
    case 'ERROR':   return 'red';
    default:        return 'gray';
  }
};

const statusIcon = (s: string) => {
  switch (s) {
    case 'OK':
      return <IconCircleCheck size={20} color="var(--mantine-color-green-6)" />;
    case 'WARNING':
      return <IconAlertTriangle size={20} color="var(--mantine-color-yellow-6)" />;
    case 'MISSING':
    case 'ERROR':
      return <IconCircleX size={20} color="var(--mantine-color-red-6)" />;
    default:
      return <IconAlertTriangle size={20} color="var(--mantine-color-gray-6)" />;
  }
};

const priorityColor = (p: string) => {
  switch (p) {
    case 'HIGH':   return 'red';
    case 'MEDIUM': return 'yellow';
    case 'LOW':    return 'blue';
    default:       return 'gray';
  }
};


function RecordCodeBlock({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <Group gap="xs" mb={4}>
        <Text fz="xs" fw={600}>{label}</Text>
        <CopyButton value={value} timeout={2000}>
          {({ copied, copy }) => (
            <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow position="right">
              <ActionIcon color={copied ? 'teal' : 'gray'} variant="subtle" size="xs" onClick={copy}>
                {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
              </ActionIcon>
            </Tooltip>
          )}
        </CopyButton>
      </Group>
      <Code block style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
        {value}
      </Code>
    </div>
  );
}

function IssuesList({ issues }: { issues: string[] }) {
  if (!issues.length) return null;
  return (
    <Stack gap={4} mt="xs">
      {issues.map((issue, i) => (
        <Group key={i} gap="xs" wrap="nowrap" align="flex-start">
          <IconAlertTriangle size={14} color="var(--mantine-color-yellow-6)" style={{ flexShrink: 0, marginTop: 3 }} />
          <Text fz="sm" c="dimmed">{issue}</Text>
        </Group>
      ))}
    </Stack>
  );
}


function SPFPanel({ spf }: { spf: SPFResult }) {
  return (
    <Stack gap="md">
      <Group gap="sm">
        {statusIcon(spf.status)}
        <Text fw={600}>SPF Status</Text>
        <Badge color={statusColor(spf.status)} variant="light">{spf.status}</Badge>
      </Group>

      <RecordCodeBlock label="SPF Record" value={spf.record} />

      {spf.parsed && 'mechanisms' in spf.parsed && spf.parsed.mechanisms.length > 0 && (
        <div>
          <Text fz="sm" fw={600} mb="xs">Mechanisms ({spf.parsed.dns_lookup_count} DNS lookups)</Text>
          <Table striped highlightOnHover withTableBorder withColumnBorders fz="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Qualifier</Table.Th>
                <Table.Th>Mechanism</Table.Th>
                <Table.Th>Value</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {spf.parsed.mechanisms.map((m, i) => (
                <Table.Tr key={i}>
                  <Table.Td>
                    <Badge variant="outline" size="sm">
                      {m.qualifier === '+' ? 'Pass (+)' :
                       m.qualifier === '-' ? 'Fail (-)' :
                       m.qualifier === '~' ? 'SoftFail (~)' :
                       'Neutral (?)'}
                    </Badge>
                  </Table.Td>
                  <Table.Td><Text fw={500}>{m.mechanism}</Text></Table.Td>
                  <Table.Td><Text ff="monospace" fz="xs">{m.value ?? '—'}</Text></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>
      )}

      <IssuesList issues={spf.issues} />
    </Stack>
  );
}


function DKIMPanel({ dkim }: { dkim: DKIMResult }) {
  return (
    <Stack gap="md">
      <Group gap="sm">
        {statusIcon(dkim.status)}
        <Text fw={600}>DKIM Status</Text>
        <Badge color={statusColor(dkim.status)} variant="light">{dkim.status}</Badge>
      </Group>

      <Text fz="xs" c="dimmed">
        Checked {dkim.selectors_checked.length} selector{dkim.selectors_checked.length !== 1 ? 's' : ''}
      </Text>

      {dkim.records.length > 0 && (
        <Accordion variant="separated">
          {dkim.records.map((entry, i) => (
            <Accordion.Item key={i} value={`dkim-${i}`}>
              <Accordion.Control>
                <Group gap="xs">
                  <Badge variant="light" color={entry.revoked ? 'red' : 'green'} size="sm">
                    {entry.revoked ? 'REVOKED' : 'ACTIVE'}
                  </Badge>
                  <Text fz="sm" fw={500}>{entry.selector}</Text>
                  <Text fz="xs" c="dimmed">({entry.key_type}{entry.estimated_key_bits ? ` ~${entry.estimated_key_bits}b` : ''})</Text>
                </Group>
              </Accordion.Control>
              <Accordion.Panel>
                <Stack gap="sm">
                  <Text fz="xs" c="dimmed">Queried: {entry.domain}</Text>
                  <RecordCodeBlock label="DKIM Record" value={entry.raw} />
                  {Object.keys(entry.tags).length > 0 && (
                    <Table striped fz="xs" withTableBorder>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Tag</Table.Th>
                          <Table.Th>Value</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {Object.entries(entry.tags).map(([k, v]) => (
                          <Table.Tr key={k}>
                            <Table.Td><Text fw={500}>{k}</Text></Table.Td>
                            <Table.Td><Text ff="monospace" style={{ wordBreak: 'break-all' }}>{v || '(empty)'}</Text></Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  )}
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      )}

      <IssuesList issues={dkim.issues} />
    </Stack>
  );
}


function DMARCPanel({ dmarc }: { dmarc: DMARCResult }) {
  const parsed = dmarc.parsed as DMARCResult['parsed'] & {
    policy?: string;
    has_aggregate_reporting?: boolean;
    has_forensic_reporting?: boolean;
    dkim_alignment?: string;
    spf_alignment?: string;
    tag_descriptions?: Record<string, string>;
    tags?: Record<string, string>;
  };

  return (
    <Stack gap="md">
      <Group gap="sm">
        {statusIcon(dmarc.status)}
        <Text fw={600}>DMARC Status</Text>
        <Badge color={statusColor(dmarc.status)} variant="light">{dmarc.status}</Badge>
      </Group>

      <RecordCodeBlock label="DMARC Record" value={dmarc.record} />

      {parsed && 'tags' in parsed && parsed.tags && Object.keys(parsed.tags).length > 0 && (
        <Table striped fz="sm" withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Tag</Table.Th>
              <Table.Th>Value</Table.Th>
              <Table.Th>Description</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {Object.entries(parsed.tags).map(([k, v]) => (
              <Table.Tr key={k}>
                <Table.Td><Text fw={500}>{k}</Text></Table.Td>
                <Table.Td><Text ff="monospace">{v}</Text></Table.Td>
                <Table.Td><Text fz="xs" c="dimmed">{parsed.tag_descriptions?.[k] ?? ''}</Text></Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      {parsed && 'policy' in parsed && (
        <Group gap="lg">
          {parsed.policy && (
            <div>
              <Text fz="xs" c="dimmed">Policy</Text>
              <Badge color={parsed.policy === 'reject' ? 'green' : parsed.policy === 'quarantine' ? 'yellow' : 'red'} size="lg">
                p={parsed.policy}
              </Badge>
            </div>
          )}
          {parsed.dkim_alignment && (
            <div>
              <Text fz="xs" c="dimmed">DKIM Alignment</Text>
              <Badge variant="outline" size="lg">{parsed.dkim_alignment}</Badge>
            </div>
          )}
          {parsed.spf_alignment && (
            <div>
              <Text fz="xs" c="dimmed">SPF Alignment</Text>
              <Badge variant="outline" size="lg">{parsed.spf_alignment}</Badge>
            </div>
          )}
          <div>
            <Text fz="xs" c="dimmed">Aggregate Reports</Text>
            <Badge variant="light" color={parsed.has_aggregate_reporting ? 'green' : 'gray'} size="lg">
              {parsed.has_aggregate_reporting ? 'Enabled' : 'Not configured'}
            </Badge>
          </div>
          <div>
            <Text fz="xs" c="dimmed">Forensic Reports</Text>
            <Badge variant="light" color={parsed.has_forensic_reporting ? 'green' : 'gray'} size="lg">
              {parsed.has_forensic_reporting ? 'Enabled' : 'Not configured'}
            </Badge>
          </div>
        </Group>
      )}

      <IssuesList issues={dmarc.issues} />
    </Stack>
  );
}


function RecommendationsPanel({ recommendations }: { recommendations: Recommendation[] }) {
  if (!recommendations.length) {
    return (
      <Alert icon={<IconCircleCheck size={18} />} color="green" variant="light">
        No issues detected — your email security configuration looks great!
      </Alert>
    );
  }

  return (
    <Accordion variant="separated">
      {recommendations.map((rec, i) => (
        <Accordion.Item key={i} value={`rec-${i}`}>
          <Accordion.Control
            icon={
              <ThemeIcon variant="light" color={priorityColor(rec.priority)} size="sm" radius="xl">
                <IconAlertTriangle size={14} />
              </ThemeIcon>
            }
          >
            <Group gap="xs">
              <Badge size="xs" color={priorityColor(rec.priority)}>{rec.priority}</Badge>
              <Text fz="sm" fw={500}>{rec.issue}</Text>
            </Group>
          </Accordion.Control>
          <Accordion.Panel>
            <List size="sm">
              <List.Item>{rec.recommendation}</List.Item>
            </List>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion>
  );
}

// Main Page

export const EmailSecurityAnalyzer = () => {
  const [domain, setDomain] = useState('');
  const [result, setResult] = useState<EmailSecurityResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async () => {
    const d = domain.trim();
    if (!d) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await emailSecurityAnalysis({ domain_name: d });
      setResult(response.data);
    } catch (err: any) {
      const message =
        err.response?.data?.message ??
        err.response?.data?.domain_name?.[0] ??
        'An error occurred while performing the analysis.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        {/* Header */}
        <div>
          <Group gap="xs" mb={4}>
            <IconMailCheck size={28} />
            <Title order={2}>Email Security Analyzer</Title>
          </Group>
          <Text c="dimmed" fz="sm">
            Analyze SPF, DKIM &amp; DMARC records for any domain. Get a security score,
            detailed breakdowns and actionable recommendations.
          </Text>
        </div>

        {/* Search */}
        <Paper withBorder p="lg" radius="md" pos="relative">
          <LoadingOverlay visible={loading} />
          <Group align="end">
            <TextInput
              label="Domain Name"
              placeholder="example.com"
              value={domain}
              onChange={(e) => setDomain(e.currentTarget.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
              size="md"
              style={{ flex: 1 }}
            />
            <Button
              leftSection={<IconSearch size={18} />}
              onClick={handleCheck}
              disabled={!domain.trim()}
              size="md"
            >
              Analyze
            </Button>
          </Group>
        </Paper>

        {/* Error */}
        {error && (
          <Alert icon={<IconAlertCircle size={18} />} color="red" title="Error" variant="light">
            {error}
          </Alert>
        )}

        {/* Results */}
        {result && (
          <Stack gap="lg">
            {/* Score card */}
            <Paper withBorder p="lg" radius="md">
              <Group justify="space-between" align="center">
                <div>
                  <Text fz="sm" c="dimmed" fw={500}>Email Security Score</Text>
                  <Group gap="xs" align="baseline">
                    <Title order={1}>{result.score}</Title>
                    <Text c="dimmed" fz="sm">/ 100</Text>
                  </Group>
                  <Progress
                    value={result.score}
                    color={gradeColor(result.grade)}
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
                    sections={[{ value: result.score, color: gradeColor(result.grade) }]}
                    label={
                      <Text ta="center" fw={700} fz="xl">
                        {result.grade}
                      </Text>
                    }
                  />
                </Center>
              </Group>
              <Divider my="md" />
              <Group gap="xs">
                <Badge variant="light" size="lg">{result.domain}</Badge>
                <Badge variant="light" color={statusColor(result.spf.status)} size="sm">SPF: {result.spf.status}</Badge>
                <Badge variant="light" color={statusColor(result.dkim.status)} size="sm">DKIM: {result.dkim.status}</Badge>
                <Badge variant="light" color={statusColor(result.dmarc.status)} size="sm">DMARC: {result.dmarc.status}</Badge>
              </Group>
            </Paper>

            {/* Tabbed detail panels */}
            <Paper withBorder p="lg" radius="md">
              <Tabs defaultValue="spf">
                <Tabs.List>
                  <Tabs.Tab value="spf" leftSection={<IconMailForward size={16} />}>
                    SPF
                  </Tabs.Tab>
                  <Tabs.Tab value="dkim" leftSection={<IconKey size={16} />}>
                    DKIM
                  </Tabs.Tab>
                  <Tabs.Tab value="dmarc" leftSection={<IconShieldLock size={16} />}>
                    DMARC
                  </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="spf" pt="md">
                  <SPFPanel spf={result.spf} />
                </Tabs.Panel>
                <Tabs.Panel value="dkim" pt="md">
                  <DKIMPanel dkim={result.dkim} />
                </Tabs.Panel>
                <Tabs.Panel value="dmarc" pt="md">
                  <DMARCPanel dmarc={result.dmarc} />
                </Tabs.Panel>
              </Tabs>
            </Paper>

            {/* Recommendations */}
            <Paper withBorder p="lg" radius="md">
              <Title order={4} mb="md">Recommendations</Title>
              <RecommendationsPanel recommendations={result.recommendations} />
            </Paper>
          </Stack>
        )}
      </Stack>
    </Container>
  );
};
