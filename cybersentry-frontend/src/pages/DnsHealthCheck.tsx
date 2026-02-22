import { useState } from 'react';
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
  Progress,
  ThemeIcon,
  RingProgress,
  Accordion,
  List,
  Center,
} from '@mantine/core';
import {
  IconShieldCheck,
  IconAlertCircle,
  IconSearch,
  IconCircleCheck,
  IconCircleX,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { dnsHealthCheck, type DnsHealthCheckResponse } from '../services/dns-tools';

const CHECK_LABELS: Record<string, string> = {
  a_record: 'A Record',
  nameservers: 'Nameservers (NS)',
  mx: 'Mail Exchange (MX)',
  spf: 'SPF Record',
  dmarc: 'DMARC Record',
};

const gradeColor = (grade: string) => {
  switch (grade) {
    case 'A': return 'green';
    case 'B': return 'teal';
    case 'C': return 'yellow';
    case 'D': return 'orange';
    case 'F': return 'red';
    default: return 'gray';
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
    case 'HIGH': return 'red';
    case 'MEDIUM': return 'yellow';
    case 'LOW': return 'blue';
    default: return 'gray';
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
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.domain_name?.[0] ||
        'An error occurred while performing the health check.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <div>
          <Group gap="xs" mb={4}>
            <IconShieldCheck size={28} />
            <Title order={2}>DNS Health Check</Title>
          </Group>
          <Text c="dimmed" fz="sm">
            Analyze the DNS configuration of any domain. Get a health score, detailed checks, and
            actionable recommendations.
          </Text>
        </div>

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
              Check
            </Button>
          </Group>
        </Paper>

        {error && (
          <Alert icon={<IconAlertCircle size={18} />} color="red" title="Error" variant="light">
            {error}
          </Alert>
        )}

        {result && (
          <Stack gap="lg">
            {/* Score card */}
            <Paper withBorder p="lg" radius="md">
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
              <Badge variant="light" size="lg">
                {result.domain}
              </Badge>
            </Paper>

            {/* Checks */}
            <Paper withBorder p="lg" radius="md">
              <Title order={4} mb="md">
                Check Results
              </Title>
              <Stack gap="sm">
                {Object.entries(result.checks).map(([key, check]) => (
                  <Paper key={key} withBorder p="sm" radius="sm">
                    <Group justify="space-between">
                      <Group gap="sm">
                        {statusIcon(check.status)}
                        <div>
                          <Text fw={500} fz="sm">
                            {CHECK_LABELS[key] || key}
                          </Text>
                          {check.impact && (
                            <Text fz="xs" c="dimmed">
                              {check.impact}
                            </Text>
                          )}
                        </div>
                      </Group>
                      <Group gap="xs">
                        <Badge
                          variant="light"
                          color={check.status === 'OK' ? 'green' : check.severity === 'CRITICAL' ? 'red' : 'yellow'}
                          size="sm"
                        >
                          {check.status}
                        </Badge>
                        {check.ttl !== undefined && (
                          <Badge variant="outline" size="sm">
                            TTL: {check.ttl}s
                          </Badge>
                        )}
                        {check.count !== undefined && (
                          <Badge variant="outline" size="sm">
                            Count: {check.count}
                          </Badge>
                        )}
                      </Group>
                    </Group>
                    {check.records && check.records.length > 0 && (
                      <Text fz="xs" ff="monospace" mt="xs" c="dimmed">
                        {check.records.join(', ')}
                      </Text>
                    )}
                  </Paper>
                ))}
              </Stack>
            </Paper>

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <Paper withBorder p="lg" radius="md">
                <Title order={4} mb="md">
                  Recommendations
                </Title>
                <Accordion variant="separated">
                  {result.recommendations.map((rec, i) => (
                    <Accordion.Item key={i} value={`rec-${i}`}>
                      <Accordion.Control
                        icon={
                          <ThemeIcon variant="light" color={priorityColor(rec.priority)} size="sm" radius="xl">
                            <IconAlertTriangle size={14} />
                          </ThemeIcon>
                        }
                      >
                        <Group gap="xs">
                          <Badge size="xs" color={priorityColor(rec.priority)}>
                            {rec.priority}
                          </Badge>
                          <Text fz="sm" fw={500}>
                            {rec.issue}
                          </Text>
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
              </Paper>
            )}
          </Stack>
        )}
      </Stack>
    </Container>
  );
};
