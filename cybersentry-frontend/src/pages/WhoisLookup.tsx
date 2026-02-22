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
import { IconSearch, IconAlertCircle, IconFileText } from '@tabler/icons-react';
import { whoisLookup, type WhoisLookupResponse } from '../services/ip-tools';

const IMPORTANT_FIELDS = [
  'domain_name',
  'registrar',
  'whois_server',
  'creation_date',
  'expiration_date',
  'updated_date',
  'name_servers',
  'status',
  'emails',
  'org',
  'address',
  'city',
  'state',
  'country',
  'registrant_postal_code',
  'dnssec',
];

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (Array.isArray(value)) return value.map(String).join(', ');
  return String(value);
}

export const WhoisLookup = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<WhoisLookupResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await whoisLookup({ query: query.trim() });
      setResult(response.data);
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.query?.[0] ||
        'An error occurred while performing the WHOIS lookup.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Split result into important fields first, then the rest
  const getFieldRows = () => {
    if (!result) return [];
    const data = result.result;
    const ordered: [string, unknown][] = [];

    // Important fields first
    for (const key of IMPORTANT_FIELDS) {
      if (key in data && data[key] !== null && data[key] !== undefined) {
        ordered.push([key, data[key]]);
      }
    }

    // Remaining fields
    for (const [key, value] of Object.entries(data)) {
      if (!IMPORTANT_FIELDS.includes(key) && value !== null && value !== undefined) {
        ordered.push([key, value]);
      }
    }

    return ordered;
  };

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <div>
          <Group gap="xs" mb={4}>
            <IconFileText size={28} />
            <Title order={2}>WHOIS Lookup</Title>
          </Group>
          <Text c="dimmed" fz="sm">
            Look up registration and ownership information for any domain name or IP address.
          </Text>
        </div>

        <Paper withBorder p="lg" radius="md" pos="relative">
          <LoadingOverlay visible={loading} />
          <Group align="end">
            <TextInput
              label="Domain or IP Address"
              placeholder="example.com or 8.8.8.8"
              value={query}
              onChange={(e) => setQuery(e.currentTarget.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
              size="md"
              style={{ flex: 1 }}
            />
            <Button
              leftSection={<IconSearch size={18} />}
              onClick={handleLookup}
              disabled={!query.trim()}
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
          <Paper withBorder p="lg" radius="md">
            <Group gap="xs" mb="md">
              <Title order={4}>WHOIS Results for</Title>
              <Badge variant="light" size="lg">
                {result.query}
              </Badge>
            </Group>
            <Divider mb="md" />

            <ScrollArea>
              <Table striped highlightOnHover withTableBorder>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th w={200}>Field</Table.Th>
                    <Table.Th>Value</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {getFieldRows().map(([field, value]) => (
                    <Table.Tr key={field}>
                      <Table.Td>
                        <Text fz="sm" fw={500} tt="capitalize">
                          {field.replace(/_/g, ' ')}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text fz="sm" ff="monospace">
                          {formatValue(value)}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </Paper>
        )}
      </Stack>
    </Container>
  );
};
