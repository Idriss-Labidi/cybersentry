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
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { IconAlertCircle, IconArrowsExchange, IconSearch } from '@tabler/icons-react';
import ToolPageLayout from '../components/ToolPageLayout';
import { reverseIp, type ReverseIpResponse } from '../services/ip-tools';
import { getApiErrorMessage } from '../utils/api-error';

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
    } catch (error: unknown) {
      const message = getApiErrorMessage(
        error,
        ['ip_address'],
        'An error occurred while performing the reverse IP lookup.'
      );
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolPageLayout
      icon={<IconArrowsExchange size={26} />}
      eyebrow="Public tool"
      title="Reverse IP lookup"
      description="Resolve hosted domains and PTR context from a target IP without changing the underlying lookup logic."
      metrics={[
        { label: 'Target IP', value: ip.trim() || 'None', hint: 'Address under review' },
        { label: 'Domains found', value: result ? String(result.domains_count) : '0', hint: 'Distinct domains returned' },
        { label: 'PTR record', value: result?.hostname || 'Pending', hint: 'Resolved hostname when available' },
      ]}
      workflow={[
        'Enter the IP address you want to investigate.',
        'Review PTR and hosted domain counts first.',
        'Use the domain list to decide whether the host requires deeper scrutiny.',
      ]}
      notes={[
        'An empty domain list is still useful when confirming that an address is not broadly shared.',
        'This page pairs well with IP reputation checks when triaging suspicious infrastructure.',
      ]}
      examples={['8.8.8.8', '1.1.1.1', '185.199.108.153']}
    >
      <Paper p="lg" radius="xl" pos="relative">
        <LoadingOverlay visible={loading} />
        <Group align="end">
          <TextInput
            label="IP Address"
            placeholder="8.8.8.8"
            value={ip}
            onChange={(event) => setIp(event.currentTarget.value)}
            onKeyDown={(event) => event.key === 'Enter' && handleLookup()}
            style={{ flex: 1 }}
          />
          <Button leftSection={<IconSearch size={18} />} onClick={handleLookup} disabled={!ip.trim()}>
            Lookup reverse IP
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
            <Title order={4} mb="md">
              Reverse IP results
            </Title>
            <Divider mb="md" />

            <Table withTableBorder>
              <Table.Tbody>
                <Table.Tr>
                  <Table.Td w={160}>
                    <Text fz="sm" fw={600}>
                      IP address
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge size="lg">{result.ip}</Badge>
                  </Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td>
                    <Text fz="sm" fw={600}>
                      Hostname (PTR)
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text fz="sm" ff="monospace">
                      {result.hostname || '-- No PTR record found'}
                    </Text>
                  </Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td>
                    <Text fz="sm" fw={600}>
                      Domains found
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={result.domains_count > 0 ? 'blue' : 'gray'}>{result.domains_count}</Badge>
                  </Table.Td>
                </Table.Tr>
              </Table.Tbody>
            </Table>
          </Paper>

          {result.domains.length > 0 ? (
            <Paper p="lg" radius="xl">
              <Group justify="space-between" mb="md">
                <Title order={4}>Domains on this IP</Title>
                <Badge size="md">
                  {result.domains_count} domain{result.domains_count !== 1 ? 's' : ''}
                </Badge>
              </Group>
              <Divider mb="md" />

              <ScrollArea h={result.domains.length > 15 ? 420 : undefined}>
                <Table striped highlightOnHover withTableBorder>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th w={60}>#</Table.Th>
                      <Table.Th>Domain Name</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {result.domains.map((domainName, index) => (
                      <Table.Tr key={index}>
                        <Table.Td>
                          <Text fz="sm" c="dimmed">
                            {index + 1}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text fz="sm" ff="monospace">
                            {domainName}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            </Paper>
          ) : (
            <Alert variant="light" color="gray" title="No domains found">
              No additional domains were found hosted on this IP address.
            </Alert>
          )}
        </Stack>
      ) : null}
    </ToolPageLayout>
  );
};
