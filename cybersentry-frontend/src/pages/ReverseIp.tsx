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
  ScrollArea,
} from '@mantine/core';
import { IconSearch, IconAlertCircle, IconArrowsExchange } from '@tabler/icons-react';
import { reverseIp, type ReverseIpResponse } from '../services/ip-tools';

export const ReverseIp = () => {
  const [ip, setIp] = useState('');
  const [result, setResult] = useState<ReverseIpResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async () => {
    if (!ip.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await reverseIp({ ip_address: ip.trim() });
      setResult(response.data);
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.ip_address?.[0] ||
        'An error occurred while performing the reverse IP lookup.';
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
            <IconArrowsExchange size={28} />
            <Title order={2}>Reverse IP Lookup</Title>
          </Group>
          <Text c="dimmed" fz="sm">
            Find the hostname and all domains hosted on a given IP address.
          </Text>
        </div>

        <Paper withBorder p="lg" radius="md" pos="relative">
          <LoadingOverlay visible={loading} />
          <Group align="end">
            <TextInput
              label="IP Address"
              placeholder="8.8.8.8"
              value={ip}
              onChange={(e) => setIp(e.currentTarget.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
              size="md"
              style={{ flex: 1 }}
            />
            <Button
              leftSection={<IconSearch size={18} />}
              onClick={handleLookup}
              disabled={!ip.trim()}
              size="md"
            >
              Lookup
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
            {/* Summary */}
            <Paper withBorder p="lg" radius="md">
              <Group gap="xs" mb="md">
                <Title order={4}>Reverse IP Results</Title>
              </Group>
              <Divider mb="md" />

              <Table withTableBorder>
                <Table.Tbody>
                  <Table.Tr>
                    <Table.Td w={140}>
                      <Text fz="sm" fw={500}>IP Address</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light" size="lg">{result.ip}</Badge>
                    </Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td>
                      <Text fz="sm" fw={500}>Hostname (PTR)</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text fz="sm" ff="monospace">
                        {result.hostname || '— No PTR record found'}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td>
                      <Text fz="sm" fw={500}>Domains Found</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light" color={result.domains_count > 0 ? 'blue' : 'gray'}>
                        {result.domains_count}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                </Table.Tbody>
              </Table>
            </Paper>

            {/* Domains list */}
            {result.domains.length > 0 && (
              <Paper withBorder p="lg" radius="md">
                <Group justify="space-between" mb="md">
                  <Title order={4}>Domains on this IP</Title>
                  <Badge variant="light" size="md">
                    {result.domains_count} domain{result.domains_count !== 1 ? 's' : ''}
                  </Badge>
                </Group>
                <Divider mb="md" />

                <ScrollArea h={result.domains.length > 15 ? 400 : undefined}>
                  <Table striped highlightOnHover withTableBorder>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th w={50}>#</Table.Th>
                        <Table.Th>Domain Name</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {result.domains.map((domain, i) => (
                        <Table.Tr key={i}>
                          <Table.Td>
                            <Text fz="sm" c="dimmed">{i + 1}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text fz="sm" ff="monospace">{domain}</Text>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </ScrollArea>
              </Paper>
            )}

            {result.domains.length === 0 && (
              <Alert variant="light" color="gray" title="No domains found">
                No other domains were found hosted on this IP address.
              </Alert>
            )}
          </Stack>
        )}
      </Stack>
    </Container>
  );
};
