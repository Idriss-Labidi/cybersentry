import { useState } from 'react';
import {
  Accordion,
  Alert,
  Badge,
  Button,
  Divider,
  Group,
  List,
  LoadingOverlay,
  Paper,
  Progress,
  RingProgress,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
  Center,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconCircleCheck,
  IconCircleX,
  IconSearch,
  IconShieldCheck,
} from '@tabler/icons-react';
import ToolPageLayout from '../../../layouts/tools/ToolPageLayout';
import { dnsHealthCheck, type DnsHealthCheckResponse } from '../../../services/dns-tools';
import { getApiErrorMessage } from '../../../utils/api-error';

const CHECK_LABELS: Record<string, string> = {
  a_record: 'A Record',
  nameservers: 'Nameservers (NS)',
  mx: 'Mail Exchange (MX)',
  spf: 'SPF Record',
  dmarc: 'DMARC Record',
};

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

const statusIcon = (status: string) => {
  switch (status) {
    case 'OK':
      return <IconCircleCheck size={20} color="var(--mantine-color-green-6)" />;
    case 'FAIL':
    case 'MISSING':
    case 'MULTIPLE':
      return <IconCircleX size={20} color="var(--mantine-color-red-6)" />;
    case 'NOT_FOUND':
      return <IconAlertTriangle size={20} color="var(--mantine-color-yellow-6)" />;
    default:
      return <IconAlertTriangle size={20} color="var(--mantine-color-gray-6)" />;
  }
};

const priorityColor = (priority: string) => {
  switch (priority) {
    case 'HIGH':
      return 'red';
    case 'MEDIUM':
      return 'yellow';
    case 'LOW':
      return 'blue';
    default:
      return 'gray';
  }
};

export const DnsHealthCheck = () => {
  const [domain, setDomain] = useState('');
  const [result, setResult] = useState<DnsHealthCheckResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async () => {
    if (!domain.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await dnsHealthCheck({ domain_name: domain.trim() });
      setResult(response.data);
    } catch (error: unknown) {
      const message = getApiErrorMessage(
        error,
        ['domain_name'],
        'An error occurred while performing the health check.'
      );
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolPageLayout
      icon={<IconShieldCheck size={26} />}
      eyebrow="Public tool"
      title="DNS health check"
      description="Analyze DNS posture, score the configuration, and review high-priority remediation guidance."
      metrics={[
        { label: 'Target', value: domain.trim() || 'None', hint: 'Domain under review' },
        {
          label: 'Score',
          value: result ? `${result.score}/100` : loading ? 'Running' : 'Ready',
          hint: result ? `Grade ${result.grade}` : 'No assessment yet',
        },
        {
          label: 'Recommendations',
          value: result ? String(result.recommendations.length) : '0',
          hint: 'Improvement opportunities surfaced by the check',
        },
      ]}
      workflow={[
        'Submit the domain to run a full DNS hygiene pass.',
        'Review the score and grade before drilling into individual checks.',
        'Use the recommendation list to prioritize remediation work.',
      ]}
      notes={[
        'A lower score does not always mean broad failure. Review the impacted checks and severity labels together.',
        'This page is best used after a standard DNS lookup when you need a posture-oriented view.',
      ]}
      examples={['example.com', 'openai.com', 'cloudflare.com']}
    >
      <Paper p="lg" radius="xl" pos="relative">
        <LoadingOverlay visible={loading} />
        <Group align="end">
          <TextInput
            label="Domain Name"
            placeholder="example.com"
            value={domain}
            onChange={(event) => setDomain(event.currentTarget.value)}
            onKeyDown={(event) => event.key === 'Enter' && handleCheck()}
            style={{ flex: 1 }}
          />
          <Button leftSection={<IconSearch size={18} />} onClick={handleCheck} disabled={!domain.trim()}>
            Run health check
          </Button>
        </Group>
      </Paper>

      {error ? (
        <Alert icon={<IconAlertCircle size={18} />} color="red" title="Error" variant="light">
          {error}
        </Alert>
      ) : null}

      {result ? (
        <Stack gap="lg">
          <Paper p="lg" radius="xl">
            <Group justify="space-between" align="center">
              <div>
                <Text fz="sm" c="dimmed" fw={500}>
                  Health Score
                </Text>
                <Group gap="xs" align="baseline">
                  <Title order={1}>{result.score}</Title>
                  <Text c="dimmed" fz="sm">
                    / 100
                  </Text>
                </Group>
                <Progress value={result.score} color={gradeColor(result.grade)} size="sm" mt="xs" w={220} />
              </div>
              <Center>
                <RingProgress
                  size={110}
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
            <Badge size="lg">{result.domain}</Badge>
          </Paper>

          <Paper p="lg" radius="xl">
            <Title order={4} mb="md">
              Check Results
            </Title>
            <Stack gap="sm">
              {Object.entries(result.checks).map(([key, check]) => (
                <Paper
                  key={key}
                  p="sm"
                  radius="lg"
                  style={{ background: 'var(--app-surface-soft)' }}
                >
                  <Group justify="space-between">
                    <Group gap="sm">
                      {statusIcon(check.status)}
                      <div>
                        <Text fw={600} fz="sm">
                          {CHECK_LABELS[key] || key}
                        </Text>
                        {check.impact ? (
                          <Text fz="xs" c="dimmed">
                            {check.impact}
                          </Text>
                        ) : null}
                      </div>
                    </Group>
                    <Group gap="xs">
                      <Badge
                        color={check.status === 'OK' ? 'green' : check.severity === 'CRITICAL' ? 'red' : 'yellow'}
                      >
                        {check.status}
                      </Badge>
                      {check.ttl !== undefined ? <Badge variant="outline">TTL: {check.ttl}s</Badge> : null}
                      {check.count !== undefined ? <Badge variant="outline">Count: {check.count}</Badge> : null}
                    </Group>
                  </Group>
                  {check.records && check.records.length > 0 ? (
                    <Text fz="xs" ff="monospace" mt="xs" c="dimmed">
                      {check.records.join(', ')}
                    </Text>
                  ) : null}
                </Paper>
              ))}
            </Stack>
          </Paper>

          {result.recommendations.length > 0 ? (
            <Paper p="lg" radius="xl">
              <Title order={4} mb="md">
                Recommendations
              </Title>
              <Accordion variant="separated">
                {result.recommendations.map((recommendation, index) => (
                  <Accordion.Item key={index} value={`rec-${index}`}>
                    <Accordion.Control
                      icon={
                        <ThemeIcon variant="light" color={priorityColor(recommendation.priority)} size="sm" radius="xl">
                          <IconAlertTriangle size={14} />
                        </ThemeIcon>
                      }
                    >
                      <Group gap="xs">
                        <Badge size="xs" color={priorityColor(recommendation.priority)}>
                          {recommendation.priority}
                        </Badge>
                        <Text fz="sm" fw={500}>
                          {recommendation.issue}
                        </Text>
                      </Group>
                    </Accordion.Control>
                    <Accordion.Panel>
                      <List size="sm">
                        <List.Item>{recommendation.recommendation}</List.Item>
                      </List>
                    </Accordion.Panel>
                  </Accordion.Item>
                ))}
              </Accordion>
            </Paper>
          ) : null}
        </Stack>
      ) : null}
    </ToolPageLayout>
  );
};
