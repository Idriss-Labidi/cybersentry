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
  RingProgress,
  Progress,
  Center,
  ThemeIcon,
  SimpleGrid,
  Box,
  Tabs,
  Card,
  Accordion,
} from '@mantine/core';
import {
  IconSearch,
  IconAlertCircle,
  IconMapPin,
  IconShieldCheck,
  IconNetwork,
  IconAlertTriangle,
  IconWorldWww,
  IconFingerprint,
} from '@tabler/icons-react';
import {
  advancedIpReputation,
  detectTyposquatting,
  type IpReputationResponse,
  type TyposquattingResponse,
} from '../services/ip-tools';

const riskColor = (level: string) => {
  switch (level) {
    case 'low':
      return 'green';
    case 'medium':
      return 'yellow';
    case 'high':
      return 'red';
    default:
      return 'gray';
  }
};

export const AdvancedSecurityScanner = () => {
  const [activeTab, setActiveTab] = useState<string | null>('ip');
  const [ipInput, setIpInput] = useState('');
  const [domainInput, setDomainInput] = useState('');
  const [ipResult, setIpResult] = useState<IpReputationResponse | null>(null);
  const [typoResult, setTypoResult] = useState<TyposquattingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleIpCheck = async () => {
    if (!ipInput.trim()) return;

    setLoading(true);
    setError(null);
    setIpResult(null);

    try {
      const response = await advancedIpReputation({ ip_address: ipInput.trim() });
      setIpResult(response.data);
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.ip_address?.[0] ||
        'An error occurred while checking IP reputation.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleTyposquattingCheck = async () => {
    if (!domainInput.trim()) return;

    setLoading(true);
    setError(null);
    setTypoResult(null);

    try {
      const response = await detectTyposquatting({ domain: domainInput.trim() });
      setTypoResult(response.data);
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
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <div>
          <Group gap="xs" mb={4}>
            <IconShieldCheck size={28} />
            <Title order={2}>Advanced Security Scanner</Title>
          </Group>
          <Text c="dimmed" fz="sm">
            Advanced IP reputation checks with typosquatting detection. All scans are saved to your history.
          </Text>
        </div>

        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="ip" leftSection={<IconFingerprint size={16} />}>
              IP Reputation
            </Tabs.Tab>
            <Tabs.Tab value="typosquatting" leftSection={<IconWorldWww size={16} />}>
              Typosquatting Detection
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="ip" pt="lg">
            <Stack gap="lg">
              <Paper withBorder p="lg" radius="md" pos="relative">
                <LoadingOverlay visible={loading} />
                <Group align="end">
                  <TextInput
                    label="IP Address"
                    placeholder="8.8.8.8"
                    value={ipInput}
                    onChange={(e) => setIpInput(e.currentTarget.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleIpCheck()}
                    size="md"
                    style={{ flex: 1 }}
                  />
                  <Button
                    leftSection={<IconSearch size={18} />}
                    onClick={handleIpCheck}
                    disabled={!ipInput.trim()}
                    size="md"
                  >
                    Check Reputation
                  </Button>
                </Group>
              </Paper>

              {error && (
                <Alert icon={<IconAlertCircle size={18} />} color="red" title="Error" variant="light">
                  {error}
                </Alert>
              )}

              {ipResult && (
                <Stack gap="lg">
                  {/* Reputation Score Card */}
                  <Paper withBorder p="lg" radius="md">
                    <Group justify="space-between" align="center">
                      <div>
                        <Text fz="sm" c="dimmed" fw={500}>
                          Reputation Score
                        </Text>
                        <Group gap="xs" align="baseline">
                          <Title order={1}>{ipResult.score}</Title>
                          <Text c="dimmed" fz="sm">
                            / 100
                          </Text>
                        </Group>
                        <Progress
                          value={ipResult.score}
                          color={riskColor(ipResult.risk_level)}
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
                          sections={[{ value: ipResult.score, color: riskColor(ipResult.risk_level) }]}
                          label={
                            <Text ta="center" fw={700} fz="lg" tt="uppercase">
                              {ipResult.risk_level}
                            </Text>
                          }
                        />
                      </Center>
                    </Group>
                    <Divider my="md" />
                    <Group gap="sm">
                      <Badge variant="light" size="lg">
                        {ipResult.ip}
                      </Badge>
                      <Badge variant="light" color={riskColor(ipResult.risk_level)} size="lg">
                        Risk: {ipResult.risk_level}
                      </Badge>
                      {ipResult.is_proxy && (
                        <Badge variant="filled" color="red" size="sm">
                          Proxy / VPN
                        </Badge>
                      )}
                      {ipResult.is_hosting && (
                        <Badge variant="filled" color="orange" size="sm">
                          Hosting
                        </Badge>
                      )}
                      {ipResult.is_mobile && (
                        <Badge variant="filled" color="blue" size="sm">
                          Mobile
                        </Badge>
                      )}
                    </Group>
                  </Paper>

                  {/* Risk Factors */}
                  {ipResult.risk_factors.length > 0 && (
                    <Paper withBorder p="lg" radius="md">
                      <Group gap="xs" mb="md">
                        <ThemeIcon variant="light" color="orange" size="md">
                          <IconAlertTriangle size={16} />
                        </ThemeIcon>
                        <Title order={4}>Risk Factors</Title>
                      </Group>
                      <Stack gap="xs">
                        {ipResult.risk_factors.map((factor, i) => (
                          <Group key={i} gap="xs">
                            <Box
                              w={6}
                              h={6}
                              style={{ borderRadius: '50%', background: 'var(--mantine-color-orange-6)' }}
                            />
                            <Text fz="sm">{factor}</Text>
                          </Group>
                        ))}
                      </Stack>
                    </Paper>
                  )}

                  <SimpleGrid cols={{ base: 1, sm: 2 }}>
                    {/* Geolocation */}
                    <Paper withBorder p="lg" radius="md">
                      <Group gap="xs" mb="md">
                        <ThemeIcon variant="light" color="blue" size="md">
                          <IconMapPin size={16} />
                        </ThemeIcon>
                        <Title order={4}>Geolocation</Title>
                      </Group>
                      <Table withTableBorder>
                        <Table.Tbody>
                          {[
                            ['Continent', ipResult.geolocation.continent],
                            [
                              'Country',
                              `${ipResult.geolocation.country || '—'} ${
                                ipResult.geolocation.country_code
                                  ? `(${ipResult.geolocation.country_code})`
                                  : ''
                              }`,
                            ],
                            ['Region', ipResult.geolocation.region],
                            ['City', ipResult.geolocation.city],
                            ['ZIP', ipResult.geolocation.zip],
                            ['Latitude', ipResult.geolocation.latitude],
                            ['Longitude', ipResult.geolocation.longitude],
                            ['Timezone', ipResult.geolocation.timezone],
                          ].map(([label, value]) => (
                            <Table.Tr key={label as string}>
                              <Table.Td w={100}>
                                <Text fz="sm" fw={500}>
                                  {label as string}
                                </Text>
                              </Table.Td>
                              <Table.Td>
                                <Text fz="sm" ff="monospace">
                                  {value ?? '—'}
                                </Text>
                              </Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                    </Paper>

                    {/* Network */}
                    <Paper withBorder p="lg" radius="md">
                      <Group gap="xs" mb="md">
                        <ThemeIcon variant="light" color="violet" size="md">
                          <IconNetwork size={16} />
                        </ThemeIcon>
                        <Title order={4}>Network</Title>
                      </Group>
                      <Table withTableBorder>
                        <Table.Tbody>
                          {[
                            ['ISP', ipResult.network.isp],
                            ['Organization', ipResult.network.org],
                            ['AS Number', ipResult.network.as_number],
                            ['AS Name', ipResult.network.as_name],
                            ['Reverse DNS', ipResult.network.reverse_dns],
                          ].map(([label, value]) => (
                            <Table.Tr key={label as string}>
                              <Table.Td w={120}>
                                <Text fz="sm" fw={500}>
                                  {label as string}
                                </Text>
                              </Table.Td>
                              <Table.Td>
                                <Text fz="sm" ff="monospace">
                                  {value ?? '—'}
                                </Text>
                              </Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                    </Paper>
                  </SimpleGrid>
                </Stack>
              )}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="typosquatting" pt="lg">
            <Stack gap="lg">
              <Paper withBorder p="lg" radius="md" pos="relative">
                <LoadingOverlay visible={loading} />
                <Group align="end">
                  <TextInput
                    label="Domain Name"
                    placeholder="example.com"
                    value={domainInput}
                    onChange={(e) => setDomainInput(e.currentTarget.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleTyposquattingCheck()}
                    size="md"
                    style={{ flex: 1 }}
                  />
                  <Button
                    leftSection={<IconSearch size={18} />}
                    onClick={handleTyposquattingCheck}
                    disabled={!domainInput.trim()}
                    size="md"
                  >
                    Detect Typosquatting
                  </Button>
                </Group>
              </Paper>

              {error && (
                <Alert icon={<IconAlertCircle size={18} />} color="red" title="Error" variant="light">
                  {error}
                </Alert>
              )}

              {typoResult && (
                <Stack gap="lg">
                  {/* Summary Card */}
                  <Card withBorder padding="lg" radius="md">
                    <Group justify="space-between" mb="md">
                      <div>
                        <Text fz="sm" c="dimmed" fw={500}>
                          Original Domain
                        </Text>
                        <Title order={3}>{typoResult.original_domain}</Title>
                      </div>
                      <Badge
                        size="xl"
                        variant="filled"
                        color={typoResult.threat_count > 0 ? 'red' : 'green'}
                      >
                        {typoResult.threat_count} threats detected
                      </Badge>
                    </Group>
                    <SimpleGrid cols={3}>
                      <div>
                        <Text fz="xs" c="dimmed" tt="uppercase" fw={700}>
                          Variants Generated
                        </Text>
                        <Text fz="lg" fw={500}>
                          {typoResult.total_variants_generated}
                        </Text>
                      </div>
                      <div>
                        <Text fz="xs" c="dimmed" tt="uppercase" fw={700}>
                          Variants Checked
                        </Text>
                        <Text fz="lg" fw={500}>
                          {typoResult.variants_checked}
                        </Text>
                      </div>
                      <div>
                        <Text fz="xs" c="dimmed" tt="uppercase" fw={700}>
                          Similar Domains Found
                        </Text>
                        <Text fz="lg" fw={500}>
                          {typoResult.similar_domains.length}
                        </Text>
                      </div>
                    </SimpleGrid>
                  </Card>

                  {/* Similar Domains */}
                  {typoResult.similar_domains.length > 0 ? (
                    <Paper withBorder p="lg" radius="md">
                      <Group gap="xs" mb="md">
                        <ThemeIcon variant="light" color="red" size="md">
                          <IconAlertTriangle size={16} />
                        </ThemeIcon>
                        <Title order={4}>Similar Domains Detected</Title>
                      </Group>
                      <Accordion variant="separated">
                        {typoResult.similar_domains.map((variant, idx) => (
                          <Accordion.Item key={idx} value={`domain-${idx}`}>
                            <Accordion.Control>
                              <Group justify="space-between">
                                <Text fw={500} ff="monospace">
                                  {variant.domain}
                                </Text>
                                <Badge
                                  color={variant.is_suspicious ? 'red' : 'gray'}
                                  variant="filled"
                                  size="sm"
                                >
                                  {variant.is_suspicious ? 'Suspicious' : 'Active'}
                                </Badge>
                              </Group>
                            </Accordion.Control>
                            <Accordion.Panel>
                              <Stack gap="xs">
                                <Group>
                                  <Text fz="sm" fw={500}>
                                    Status:
                                  </Text>
                                  <Text fz="sm">
                                    {variant.exists ? 'Domain exists' : 'Domain does not exist'}
                                  </Text>
                                </Group>
                                {variant.registrar && (
                                  <Group>
                                    <Text fz="sm" fw={500}>
                                      Registrar:
                                    </Text>
                                    <Text fz="sm">{variant.registrar}</Text>
                                  </Group>
                                )}
                                {variant.creation_date && (
                                  <Group>
                                    <Text fz="sm" fw={500}>
                                      Created:
                                    </Text>
                                    <Text fz="sm">{variant.creation_date}</Text>
                                  </Group>
                                )}
                                {variant.error && (
                                  <Text fz="sm" c="dimmed">
                                    Error: {variant.error}
                                  </Text>
                                )}
                              </Stack>
                            </Accordion.Panel>
                          </Accordion.Item>
                        ))}
                      </Accordion>
                    </Paper>
                  ) : (
                    <Alert color="green" title="No threats detected" variant="light">
                      No similar domains were found for {typoResult.original_domain}. Your domain appears
                      to be safe from typosquatting.
                    </Alert>
                  )}
                </Stack>
              )}
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
};

