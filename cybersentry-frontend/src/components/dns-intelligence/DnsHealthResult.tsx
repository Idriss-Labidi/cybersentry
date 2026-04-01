import type { ReactNode } from 'react';
import {
  Accordion,
  Alert,
  Badge,
  Center,
  Divider,
  Group,
  List,
  Paper,
  Progress,
  RingProgress,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconCircleX,
} from '@tabler/icons-react';
import type {
  DnsHealthCheckResponse,
  DnsHealthHistoryEntry,
} from '../../services/dns-tools';

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

type DnsHealthResultProps = {
  result: DnsHealthCheckResponse | DnsHealthHistoryEntry;
  actions?: ReactNode;
  scoreLabel?: string;
};

export default function DnsHealthResult({
  result,
  actions,
  scoreLabel = 'Health Score',
}: DnsHealthResultProps) {
  const domain = 'domain' in result ? result.domain : result.domain_name;

  return (
    <Stack gap="lg">
      <Paper p="lg" radius="xl">
        <Group justify="space-between" align="center">
          <div>
            <Text fz="sm" c="dimmed" fw={500}>
              {scoreLabel}
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
        <Group gap="sm">
          <Badge size="lg">{domain}</Badge>
          {actions}
        </Group>
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
              <Accordion.Item key={`${recommendation.issue}-${index}`} value={`rec-${index}`}>
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
      ) : (
        <Alert icon={<IconCircleCheck size={16} />} color="green" variant="light">
          No recommendations for this scan.
        </Alert>
      )}
    </Stack>
  );
}
