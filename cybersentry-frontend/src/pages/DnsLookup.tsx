import { useState } from 'react';
import {
  Alert,
  Badge,
  Box,
  Button,
  Chip,
  Divider,
  Group,
  LoadingOverlay,
  Paper,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { IconAlertCircle, IconSearch, IconWorld } from '@tabler/icons-react';
import ToolPageLayout from '../components/ToolPageLayout';
import { dnsLookup, type DnsLookupResponse } from '../services/dns-tools';
import { getApiErrorMessage } from '../utils/api-error';

const RECORD_TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SOA'];

export const DnsLookup = () => {
  const [domain, setDomain] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['A']);
  const [result, setResult] = useState<DnsLookupResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async () => {
    if (!domain.trim() || selectedTypes.length === 0) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await dnsLookup({
        domain_name: domain.trim(),
        record_types: selectedTypes,
      });
      setResult(response.data);
    } catch (error: unknown) {
      const message = getApiErrorMessage(
        error,
        ['domain_name'],
        'An error occurred while performing the DNS lookup.'
      );
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolPageLayout
      icon={<IconWorld size={26} />}
      eyebrow="Public tool"
      title="DNS lookup"
      description="Query DNS records for any domain and review the returned values in a cleaner analytical shell."
      metrics={[
        { label: 'Selected record types', value: String(selectedTypes.length), hint: selectedTypes.join(', ') },
        { label: 'Current target', value: domain.trim() || 'None', hint: 'Domain under inspection' },
        {
          label: 'Result state',
          value: result ? 'Loaded' : loading ? 'Running' : 'Ready',
          hint: result ? `${Object.keys(result.result).length} groups returned` : 'Awaiting query',
        },
      ]}
      workflow={[
        'Enter the target domain and choose the record classes you want to inspect.',
        'Run the lookup and compare values by record type.',
        'Use TXT, MX, and NS results as a baseline before moving to deeper checks.',
      ]}
      notes={[
        'A and AAAA records are best reviewed together when validating hosting changes.',
        'TXT output is often the quickest way to inspect SPF and ownership markers.',
      ]}
      examples={['example.com', 'openai.com', 'github.com']}
    >
      <Paper p="lg" radius="xl" pos="relative">
        <LoadingOverlay visible={loading} />
        <Stack gap="md">
          <TextInput
            label="Domain Name"
            placeholder="example.com"
            value={domain}
            onChange={(event) => setDomain(event.currentTarget.value)}
            onKeyDown={(event) => event.key === 'Enter' && handleLookup()}
          />

          <div>
            <Text fz="sm" fw={700} mb="xs">
              Record Types
            </Text>
            <Chip.Group multiple value={selectedTypes} onChange={setSelectedTypes}>
              <Group gap="xs">
                {RECORD_TYPES.map((type) => (
                  <Chip key={type} value={type} variant="outline">
                    {type}
                  </Chip>
                ))}
              </Group>
            </Chip.Group>
          </div>

          <Button
            leftSection={<IconSearch size={18} />}
            onClick={handleLookup}
            disabled={!domain.trim() || selectedTypes.length === 0}
          >
            Lookup records
          </Button>
        </Stack>
      </Paper>

      {error ? (
        <Alert icon={<IconAlertCircle size={18} />} color="red" title="Error" variant="light">
          {error}
        </Alert>
      ) : null}

      {result ? (
        <Paper p="lg" radius="xl">
          <Group gap="xs" mb="md">
            <Title order={4}>Results for</Title>
            <Badge size="lg">{result.domain}</Badge>
          </Group>
          <Divider mb="md" />

          <Stack gap="md">
            {Object.entries(result.result).map(([recordType, records]) => (
              <Box key={recordType}>
                <Badge variant="filled" mb="xs">
                  {recordType}
                </Badge>
                {typeof records === 'string' ? (
                  <Text c="dimmed" fz="sm" ml="xs">
                    {records}
                  </Text>
                ) : (
                  <Table striped highlightOnHover withTableBorder>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Record Value</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {records.map((record, index) => (
                        <Table.Tr key={index}>
                          <Table.Td>
                            <Text fz="sm" ff="monospace">
                              {record}
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                )}
              </Box>
            ))}
          </Stack>
        </Paper>
      ) : null}
    </ToolPageLayout>
  );
};
