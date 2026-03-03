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
  Table,
  Center,
  ThemeIcon,
  SimpleGrid,
  Card,
} from '@mantine/core';
import {
  IconSearch,
  IconAlertCircle,
  IconWorldWww,
  IconFingerprint,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import { detectTyposquatting, type TyposquattingResponse } from '../services/ip-tools';

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
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.domain?.[0] ||
        'An error occurred while detecting typosquatting.';
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
            <IconFingerprint size={28} />
            <Title order={2}>Typosquatting Detection</Title>
          </Group>
          <Text c="dimmed" fz="sm">
            Detect similar domains that could be used for phishing or other malicious purposes.
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
              Scan
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
            {/* Summary Card */}
            <Paper withBorder p="lg" radius="md">
              <Group justify="space-between">
                <div>
                  <Text fz="sm" c="dimmed" fw={500}>
                    Original Domain
                  </Text>
                  <Title order={3}>{result.original_domain}</Title>
                </div>
                <div>
                  <Text fz="sm" c="dimmed" fw={500} ta="right">
                    Threats Detected
                  </Text>
                  <Group gap="xs" justify="flex-end">
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
                  </Group>
                </div>
              </Group>

              <Divider my="md" />

              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                <Card shadow="xs" padding="md" radius="md" withBorder>
                  <Text c="dimmed" fz="sm">
                    Total Variants Generated
                  </Text>
                  <Title order={2}>{result.total_variants_generated}</Title>
                </Card>
                <Card shadow="xs" padding="md" radius="md" withBorder>
                  <Text c="dimmed" fz="sm">
                    Variants Checked
                  </Text>
                  <Title order={2}>{result.variants_checked}</Title>
                </Card>
              </SimpleGrid>
            </Paper>

            {/* Similar Domains Table */}
            {result.similar_domains.length > 0 ? (
              <Paper withBorder p="lg" radius="md">
                <Group gap="xs" mb="lg">
                  <IconWorldWww size={20} />
                  <Title order={4}>Detected Similar Domains</Title>
                </Group>

                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Domain</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>IP Address</Table.Th>
                      <Table.Th>Risk</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {result.similar_domains.map((domain, idx) => (
                      <Table.Tr key={idx}>
                        <Table.Td>
                          <Text fw={500}>{domain.domain}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            {domain.exists ? (
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
                                <Text fz="sm">Not Registered</Text>
                              </>
                            )}
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Text fz="sm">{domain.domain || 'N/A'}</Text>
                        </Table.Td>
                        <Table.Td>
                          {domain.is_suspicious ? (
                            <Badge color="red" size="sm">
                              Suspicious
                            </Badge>
                          ) : (
                            <Badge color="gray" size="sm">
                              Unknown
                            </Badge>
                          )}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Paper>
            ) : (
              <Paper withBorder p="lg" radius="md" bg="green.0">
                <Center>
                  <Group gap="sm">
                    <ThemeIcon color="green" size="lg" radius="md">
                      <IconCheck size={24} />
                    </ThemeIcon>
                    <div>
                      <Title order={5}>No Threats Detected</Title>
                      <Text c="dimmed" fz="sm">
                        No suspicious similar domains were found.
                      </Text>
                    </div>
                  </Group>
                </Center>
              </Paper>
            )}
          </Stack>
        )}
      </Stack>
    </Container>
  );
};

