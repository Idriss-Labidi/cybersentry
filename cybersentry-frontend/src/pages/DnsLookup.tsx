import { useState } from 'react';
import {
  Container,
  Title,
  Text,
  TextInput,
  Button,
  Group,
  Chip,
  Paper,
  Table,
  Alert,
  Stack,
  LoadingOverlay,
  Badge,
  Divider,
  Box,
} from '@mantine/core';
import { IconSearch, IconAlertCircle, IconWorld } from '@tabler/icons-react';
import { dnsLookup, type DnsLookupResponse } from '../services/dns-tools';

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
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.domain_name?.[0] ||
        'An error occurred while performing the DNS lookup.';
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
            <IconWorld size={28} />
            <Title order={2}>DNS Lookup</Title>
          </Group>
          <Text c="dimmed" fz="sm">
            Query DNS records for any domain name. Select the record types you want to look up.
          </Text>
        </div>

        <Paper withBorder p="lg" radius="md" pos="relative">
          <LoadingOverlay visible={loading} />
          <Stack gap="md">
            <TextInput
              label="Domain Name"
              placeholder="example.com"
              value={domain}
              onChange={(e) => setDomain(e.currentTarget.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
              size="md"
            />

            <div>
              <Text fz="sm" fw={500} mb="xs">
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
              size="md"
            >
              Lookup
            </Button>
          </Stack>
        </Paper>

        {error && (
          <Alert icon={<IconAlertCircle size={18} />} color="red" title="Error" variant="light">
            {error}
          </Alert>
        )}

        {result && (
          <Paper withBorder p="lg" radius="md">
            <Group gap="xs" mb="md">
              <Title order={4}>Results for</Title>
              <Badge variant="light" size="lg">
                {result.domain}
              </Badge>
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
                        {records.map((record, i) => (
                          <Table.Tr key={i}>
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
        )}
      </Stack>
    </Container>
  );
};
