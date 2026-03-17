import { useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Divider,
  Group,
  LoadingOverlay,
  Paper,
  ScrollArea,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { IconAlertCircle, IconFileText, IconSearch } from '@tabler/icons-react';
import ToolPageLayout from '../../../layouts/tools/ToolPageLayout';
import { whoisLookup, type WhoisLookupResponse } from '../../../services/ip-tools';
import { getApiErrorMessage } from '../../../utils/api-error';

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
  if (value === null || value === undefined) return '--';
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
    } catch (error: unknown) {
      const message = getApiErrorMessage(
        error,
        ['query'],
        'An error occurred while performing the WHOIS lookup.'
      );
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const getFieldRows = () => {
    if (!result) return [] as [string, unknown][];

    const ordered: [string, unknown][] = [];
    const data = result.result;

    for (const key of IMPORTANT_FIELDS) {
      if (key in data && data[key] !== null && data[key] !== undefined) {
        ordered.push([key, data[key]]);
      }
    }

    for (const [key, value] of Object.entries(data)) {
      if (!IMPORTANT_FIELDS.includes(key) && value !== null && value !== undefined) {
        ordered.push([key, value]);
      }
    }

    return ordered;
  };

  const rows = getFieldRows();

  return (
    <ToolPageLayout
      icon={<IconFileText size={26} />}
      eyebrow="Public tool"
      title="WHOIS lookup"
      description="Inspect registration, ownership, and registrar metadata for domains and IP addresses from a focused reporting surface."
      metrics={[
        { label: 'Current query', value: query.trim() || 'None', hint: 'Domain or IP target' },
        { label: 'Rows returned', value: result ? String(rows.length) : '0', hint: 'Structured WHOIS fields' },
        { label: 'Priority fields', value: String(IMPORTANT_FIELDS.length), hint: 'Fields surfaced first when present' },
      ]}
      workflow={[
        'Submit the domain or IP you need to inspect.',
        'Review registrar, lifecycle, and nameserver data before deeper analysis.',
        'Use the remaining field list for ownership and operational context.',
      ]}
      notes={[
        'WHOIS quality varies by TLD and registrar, so sparse output is not always an error.',
        'Pair this with DNS lookup when investigating suspicious delegation or hosting changes.',
      ]}
      examples={['example.com', 'github.com', '8.8.8.8']}
    >
      <Paper p="lg" radius="xl" pos="relative">
        <LoadingOverlay visible={loading} />
        <Group align="end">
          <TextInput
            label="Domain or IP Address"
            placeholder="example.com or 8.8.8.8"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            onKeyDown={(event) => event.key === 'Enter' && handleLookup()}
            style={{ flex: 1 }}
          />
          <Button leftSection={<IconSearch size={18} />} onClick={handleLookup} disabled={!query.trim()}>
            Lookup WHOIS
          </Button>
        </Group>
      </Paper>

      {error ? (
        <Alert icon={<IconAlertCircle size={18} />} color="red" title="Error" variant="light">
          {error}
        </Alert>
      ) : null}

      {result ? (
        <Paper p="lg" radius="xl">
          <Group gap="xs" mb="md">
            <Title order={4}>WHOIS results for</Title>
            <Badge size="lg">{result.query}</Badge>
          </Group>
          <Divider mb="md" />

          <ScrollArea>
            <Table striped highlightOnHover withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th w={220}>Field</Table.Th>
                  <Table.Th>Value</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows.map(([field, value]) => (
                  <Table.Tr key={field}>
                    <Table.Td>
                      <Text fz="sm" fw={600} tt="capitalize">
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
      ) : null}
    </ToolPageLayout>
  );
};
