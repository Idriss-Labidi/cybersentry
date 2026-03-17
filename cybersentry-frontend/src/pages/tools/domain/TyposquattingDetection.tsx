import { useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Center,
  Divider,
  Group,
  LoadingOverlay,
  Paper,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconCheck,
  IconFingerprint,
  IconSearch,
  IconWorldWww,
  IconX,
} from '@tabler/icons-react';
import ToolPageLayout from '../../../layouts/tools/ToolPageLayout';
import { detectTyposquatting, type TyposquattingResponse } from '../../../services/ip-tools';
import { getApiErrorMessage } from '../../../utils/api-error';

export const TyposquattingDetection = () => {
  const [domain, setDomain] = useState('');
  const [result, setResult] = useState<TyposquattingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async () => {
    if (!domain.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await detectTyposquatting({ domain: domain.trim() });
      setResult(response.data);
    } catch (error: unknown) {
      const message = getApiErrorMessage(
        error,
        ['domain'],
        'An error occurred while detecting typosquatting.'
      );
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolPageLayout
      icon={<IconFingerprint size={26} />}
      eyebrow="Public tool"
      title="Typosquatting detection"
      description="Generate likely domain variants, check which ones are registered, and surface suspicious lookalikes in one pass."
      metrics={[
        { label: 'Target domain', value: domain.trim() || 'None', hint: 'Brand or property under review' },
        { label: 'Threats detected', value: result ? String(result.threat_count) : '0', hint: 'Suspicious domains returned' },
        { label: 'Variants checked', value: result ? String(result.variants_checked) : '0', hint: 'Generated and evaluated candidates' },
      ]}
      workflow={[
        'Submit the brand domain you want to protect.',
        'Review the threat count before examining individual variants.',
        'Use registered suspicious domains as the highest-priority triage set.',
      ]}
      notes={[
        'A domain can be registered but still low priority if it does not look operationally risky.',
        'This page is strongest when used alongside WHOIS lookup for suspicious registered variants.',
      ]}
      examples={['example.com', 'openai.com', 'github.com']}
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
            Scan variants
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
            <Group justify="space-between" align="flex-start">
              <div>
                <Text fz="sm" c="dimmed" fw={500}>
                  Original Domain
                </Text>
                <Title order={3}>{result.original_domain}</Title>
              </div>
              <div>
                <Text fz="sm" c="dimmed" fw={500} ta="right">
                  Threats detected
                </Text>
                <Badge
                  size="lg"
                  variant="gradient"
                  gradient={{
                    from: result.threat_count > 0 ? 'red' : 'green',
                    to: result.threat_count > 0 ? 'orange' : 'lime',
                  }}
                >
                  {result.threat_count}
                </Badge>
              </div>
            </Group>

            <Divider my="md" />

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <Card p="md">
                <Text c="dimmed" fz="sm">
                  Total variants generated
                </Text>
                <Title order={2}>{result.total_variants_generated}</Title>
              </Card>
              <Card p="md">
                <Text c="dimmed" fz="sm">
                  Variants checked
                </Text>
                <Title order={2}>{result.variants_checked}</Title>
              </Card>
            </SimpleGrid>
          </Paper>

          {result.similar_domains.length > 0 ? (
            <Paper p="lg" radius="xl">
              <Group gap="xs" mb="lg">
                <IconWorldWww size={20} />
                <Title order={4}>Detected similar domains</Title>
              </Group>

              <Table striped highlightOnHover withTableBorder>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Domain</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Observed Value</Table.Th>
                    <Table.Th>Risk</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {result.similar_domains.map((item, index) => (
                    <Table.Tr key={index}>
                      <Table.Td>
                        <Text fw={600}>{item.domain}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          {item.exists ? (
                            <>
                              <ThemeIcon color="red" size="sm" radius="md">
                                <IconCheck size={14} />
                              </ThemeIcon>
                              <Text fz="sm">Registered</Text>
                            </>
                          ) : (
                            <>
                              <ThemeIcon color="green" size="sm" radius="md">
                                <IconX size={14} />
                              </ThemeIcon>
                              <Text fz="sm">Not registered</Text>
                            </>
                          )}
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text fz="sm">{item.domain || 'N/A'}</Text>
                      </Table.Td>
                      <Table.Td>
                        {item.is_suspicious ? <Badge color="red">Suspicious</Badge> : <Badge color="gray">Unknown</Badge>}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
          ) : (
            <Paper p="lg" radius="xl" bg="green.0">
              <Center>
                <Group gap="sm">
                  <ThemeIcon color="green" size="lg" radius="md">
                    <IconCheck size={24} />
                  </ThemeIcon>
                  <div>
                    <Title order={5}>No threats detected</Title>
                    <Text c="dimmed" fz="sm">
                      No suspicious similar domains were found.
                    </Text>
                  </div>
                </Group>
              </Center>
            </Paper>
          )}
        </Stack>
      ) : null}
    </ToolPageLayout>
  );
};
