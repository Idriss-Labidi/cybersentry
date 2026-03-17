import { useEffect, useState } from 'react';
import {
  Title,
  Text,
  TextInput,
  Button,
  Paper,
  Stack,
  Group,
  Select,
  Chip,
  LoadingOverlay,
  Alert,
  Badge,
  Divider,
  Table,
  Tooltip,
  Box,
  useMantineTheme,
  useMantineColorScheme,
} from '@mantine/core';
import { IconSearch, IconAlertCircle, IconWorldWww } from '@tabler/icons-react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps';
import {
  dnsPropagation,
  getDnsServers,
  type DnsPropagationResponse,
  type DnsServer,
  type ResolverResult,
} from '../../../../services/dns-tools';
import ToolPageLayout from '../../../../layouts/tools/ToolPageLayout';
import { getApiErrorMessage } from '../../../../utils/api-error';

const WORLD_GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

const RECORD_TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SOA'];
const REGIONS = [
  { value: 'na', label: 'North America' },
  { value: 'eu', label: 'Europe' },
  { value: 'apac', label: 'Asia-Pacific' },
  { value: 'mea', label: 'Middle East & Africa' },
  { value: 'latam', label: 'Latin America' },
];

/**
 * Approximate lat/lng for known DNS server locations based on city.
 * We parse the location string "City, State/Province, Country" from the DnsServer model.
 */
const CITY_COORDS: Record<string, [number, number]> = {
  'mountain view': [-122.08, 37.39],
  'san francisco': [-122.42, 37.77],
  'zurich': [8.54, 47.37],
  'luxembourg city': [6.13, 49.61],
  'moscow': [37.62, 55.76],
  'san jose': [-121.89, 37.34],
  'reston': [-77.36, 38.97],
  'london': [-0.12, 51.51],
  'frankfurt': [8.68, 50.11],
  'tokyo': [139.69, 35.69],
  'sydney': [151.21, -33.87],
  'singapore': [103.85, 1.29],
  'mumbai': [72.88, 19.08],
  'sao paulo': [-46.63, -23.55],
  'toronto': [-79.38, 43.65],
  'paris': [2.35, 48.86],
  'amsterdam': [4.90, 52.37],
  'dubai': [55.27, 25.20],
  'johannesburg': [28.05, -26.20],
  'seoul': [126.98, 37.57],
  'hong kong': [114.17, 22.32],
  'chicago': [-87.63, 41.88],
  'dallas': [-96.80, 32.78],
  'los angeles': [-118.24, 34.05],
  'new york': [-74.01, 40.71],
  'seattle': [-122.33, 47.61],
  'denver': [-104.99, 39.74],
  'miami': [-80.19, 25.76],
  'atlanta': [-84.39, 33.75],
  'berlin': [13.41, 52.52],
  'madrid': [-3.70, 40.42],
  'stockholm': [18.07, 59.33],
  'beijing': [116.40, 39.90],
  'cape town': [18.42, -33.93],
  'nairobi': [36.82, -1.29],
  'cairo': [31.24, 30.04],
  'buenos aires': [-58.38, -34.60],
  'lima': [-77.04, -12.05],
  'mexico city': [-99.13, 19.43],
  'jakarta': [106.85, -6.21],
  'bangkok': [100.50, 13.76],
  'manila': [120.98, 14.60],
  'riyadh': [46.68, 24.71],
  'istanbul': [28.98, 41.01],
  'warsaw': [21.01, 52.23],
  'lagos': [ 3.38, 6.52],
};

function coordsFromLocation(location: string): [number, number] | null {
  const lower = location.toLowerCase();
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (lower.includes(city)) return coords;
  }
  return null;
}

/** Build a lookup from IP address → DnsServer model */
function buildServerIndex(servers: DnsServer[]) {
  const map = new Map<string, DnsServer>();
  for (const s of servers) {
    if (s.ip_address1) map.set(s.ip_address1, s);
    if (s.ip_address2) map.set(s.ip_address2, s);
  }
  return map;
}

interface MarkerData {
  coords: [number, number];
  server: DnsServer;
  ip: string;
  results: Record<string, ResolverResult>;
  status: 'ok' | 'partial' | 'fail';
}

function statusColor(status: string) {
  switch (status) {
    case 'ok': return 'var(--mantine-color-green-6)';
    case 'partial': return 'var(--mantine-color-yellow-6)';
    case 'fail': return 'var(--mantine-color-red-6)';
    default: return 'var(--mantine-color-gray-6)';
  }
}

export const DnsPropagation = () => {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const [domain, setDomain] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['A']);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [ipVersion, setIpVersion] = useState<string>('IPV4');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DnsPropagationResponse | null>(null);
  const [servers, setServers] = useState<DnsServer[]>([]);
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [activeMarker, setActiveMarker] = useState<MarkerData | null>(null);

  // Fetch DNS servers on mount
  useEffect(() => {
    getDnsServers()
      .then((res) => setServers(res.data))
      .catch(() => {});
  }, []);

  const handleCheck = async () => {
    if (!domain.trim() || selectedTypes.length === 0) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setMarkers([]);
    setActiveMarker(null);

    try {
      const regions = selectedRegions.length > 0 ? selectedRegions : undefined;
      const response = await dnsPropagation({
        domain_name: domain.trim(),
        record_types: selectedTypes,
        regions,
        ip_version: ipVersion as 'IPV4' | 'IPV6',
        timeout: 5,
        lifetime: 5,
        retries: 1,
      });
      setResult(response.data);
      buildMarkers(response.data);
    } catch (error: unknown) {
      const message = getApiErrorMessage(
        error,
        ['domain_name'],
        'An error occurred while checking DNS propagation.'
      );
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const buildMarkers = (data: DnsPropagationResponse) => {
    const index = buildServerIndex(servers);
    const newMarkers: MarkerData[] = [];

    for (const [, regionResults] of Object.entries(data.propagation)) {
      for (const [ip, recordResults] of Object.entries(regionResults)) {
        const server = index.get(ip);
        if (!server) continue;
        const coords = coordsFromLocation(server.location);
        if (!coords) continue;

        const statuses = Object.values(recordResults).map((r) => r.status);
        let overallStatus: 'ok' | 'partial' | 'fail' = 'ok';
        if (statuses.every((s) => s !== 'ok')) overallStatus = 'fail';
        else if (statuses.some((s) => s !== 'ok')) overallStatus = 'partial';

        newMarkers.push({
          coords,
          server,
          ip,
          results: recordResults,
          status: overallStatus,
        });
      }
    }
    setMarkers(newMarkers);
  };

  const totalServers = markers.length;
  const okCount = markers.filter((m) => m.status === 'ok').length;
  const failCount = markers.filter((m) => m.status === 'fail').length;

  return (
    <ToolPageLayout
      icon={<IconWorldWww size={26} />}
      eyebrow="Public tool"
      title="DNS propagation checker"
      description="Check record propagation across public resolver regions and inspect the result on an interactive map."
      metrics={[
        { label: 'Record types', value: String(selectedTypes.length), hint: selectedTypes.join(', ') },
        { label: 'Regions', value: selectedRegions.length > 0 ? String(selectedRegions.length) : 'All', hint: 'Resolver groups in scope' },
        { label: 'Healthy resolvers', value: result ? `${okCount}/${totalServers}` : 'Pending', hint: ipVersion },
      ]}
      workflow={[
        'Select the domain, record types, and optional region subset.',
        'Run the propagation check to populate the map and regional tables.',
        'Use marker detail for resolver-level comparison before opening the full region table.',
      ]}
      notes={[
        'Leaving regions empty checks the broadest available resolver set.',
        'Propagation drift is easiest to spot when you compare the summary badges with the per-resolver detail panel.',
      ]}
      examples={['example.com', 'openai.com', 'cloudflare.com']}
      mainSpan={9}
    >
      <Stack gap="lg">

        {/* Query form */}
        <Paper withBorder p="lg" radius="md" pos="relative">
          <LoadingOverlay visible={loading} />
          <Stack gap="md">
            <Group grow align="end">
              <TextInput
                label="Domain Name"
                placeholder="example.com"
                value={domain}
                onChange={(e) => setDomain(e.currentTarget.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                size="md"
              />
              <Select
                label="IP Version"
                data={[
                  { value: 'IPV4', label: 'IPv4' },
                  { value: 'IPV6', label: 'IPv6' },
                ]}
                value={ipVersion}
                onChange={(v) => setIpVersion(v || 'IPV4')}
                size="md"
              />
            </Group>

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

            <div>
              <Text fz="sm" fw={500} mb="xs">
                Regions (leave empty for all)
              </Text>
              <Chip.Group
                multiple
                value={selectedRegions}
                onChange={setSelectedRegions}
              >
                <Group gap="xs">
                  {REGIONS.map((r) => (
                    <Chip key={r.value} value={r.value} variant="outline">
                      {r.label}
                    </Chip>
                  ))}
                </Group>
              </Chip.Group>
            </div>

            <Button
              leftSection={<IconSearch size={18} />}
              onClick={handleCheck}
              disabled={!domain.trim() || selectedTypes.length === 0}
              size="md"
            >
              Check Propagation
            </Button>
          </Stack>
        </Paper>

        {error && (
          <Alert icon={<IconAlertCircle size={18} />} color="red" title="Error" variant="light">
            {error}
          </Alert>
        )}

        {/* Map + results */}
        {result && (
          <Stack gap="lg">
            {/* Summary badges */}
            <Group gap="md">
              <Badge variant="light" color="blue" size="lg">
                {result.domain}
              </Badge>
              <Badge variant="light" color="green" size="lg">
                {okCount} / {totalServers} OK
              </Badge>
              {failCount > 0 && (
                <Badge variant="light" color="red" size="lg">
                  {failCount} Failed
                </Badge>
              )}
            </Group>

            {/* Interactive map */}
            <Paper
              withBorder
              radius="md"
              style={{ overflow: 'hidden' }}
            >
              <ComposableMap
                projectionConfig={{ scale: 147 }}
                width={800}
                height={400}
                style={{ width: '100%', height: 'auto' }}
              >
                <ZoomableGroup>
                  <Geographies geography={WORLD_GEO_URL}>
                    {({ geographies }) =>
                      geographies.map((geo) => (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[2]}
                          stroke={colorScheme === 'dark' ? theme.colors.dark[3] : theme.colors.gray[4]}
                          strokeWidth={0.5}
                          style={{
                            default: { outline: 'none' },
                            hover: { outline: 'none', fill: theme.colors.gray[4] },
                            pressed: { outline: 'none' },
                          }}
                        />
                      ))
                    }
                  </Geographies>

                  {markers.map((marker, i) => (
                    <Marker
                      key={`${marker.ip}-${i}`}
                      coordinates={marker.coords}
                      onClick={() => setActiveMarker(marker)}
                      style={{ default: { cursor: 'pointer' }, hover: { cursor: 'pointer' }, pressed: {} }}
                    >
                      <Tooltip
                        label={`${marker.server.name} (${marker.ip}) — ${marker.status.toUpperCase()}`}
                        position="top"
                        withArrow
                      >
                        <circle
                          r={5}
                          fill={statusColor(marker.status)}
                          stroke="#fff"
                          strokeWidth={1.5}
                        />
                      </Tooltip>
                      {/* Pulse ring for ok */}
                      {marker.status === 'ok' && (
                        <circle
                          r={10}
                          fill="none"
                          stroke={statusColor(marker.status)}
                          strokeWidth={1}
                          opacity={0.4}
                        />
                      )}
                    </Marker>
                  ))}
                </ZoomableGroup>
              </ComposableMap>

              {/* Legend */}
              <Group gap="lg" p="sm" justify="center">
                <Group gap={6}>
                  <Box w={12} h={12} style={{ borderRadius: '50%', background: 'var(--mantine-color-green-6)' }} />
                  <Text fz="xs">Resolved</Text>
                </Group>
                <Group gap={6}>
                  <Box w={12} h={12} style={{ borderRadius: '50%', background: 'var(--mantine-color-yellow-6)' }} />
                  <Text fz="xs">Partial</Text>
                </Group>
                <Group gap={6}>
                  <Box w={12} h={12} style={{ borderRadius: '50%', background: 'var(--mantine-color-red-6)' }} />
                  <Text fz="xs">Failed</Text>
                </Group>
              </Group>
            </Paper>

            {/* Selected marker detail */}
            {activeMarker && (
              <Paper withBorder p="lg" radius="md">
                <Group justify="space-between" mb="md">
                  <div>
                    <Title order={4}>{activeMarker.server.name}</Title>
                    <Text fz="sm" c="dimmed">
                      {activeMarker.server.location} &middot; {activeMarker.ip}
                    </Text>
                  </div>
                  <Badge variant="light" color={activeMarker.status === 'ok' ? 'green' : activeMarker.status === 'partial' ? 'yellow' : 'red'}>
                    {activeMarker.status.toUpperCase()}
                  </Badge>
                </Group>
                <Table striped highlightOnHover withTableBorder>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Record Type</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Records</Table.Th>
                      <Table.Th>Latency</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {Object.entries(activeMarker.results).map(([rType, res]) => (
                      <Table.Tr key={rType}>
                        <Table.Td>
                          <Badge variant="light" size="sm">
                            {rType}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            variant="light"
                            color={res.status === 'ok' ? 'green' : res.status === 'timeout' ? 'yellow' : 'red'}
                            size="sm"
                          >
                            {res.status}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text fz="xs" ff="monospace">
                            {res.records?.join(', ') || res.error || '—'}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          {res.latency_ms !== undefined ? (
                            <Text fz="xs">{res.latency_ms} ms</Text>
                          ) : (
                            '—'
                          )}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Paper>
            )}

            {/* Full results table per region */}
            <Paper withBorder p="lg" radius="md">
              <Title order={4} mb="md">
                All Results by Region
              </Title>
              {Object.entries(result.propagation).map(([region, regionResults]) => (
                <Box key={region} mb="lg">
                  <Group gap="xs" mb="xs">
                    <Badge variant="filled" size="md">
                      {REGIONS.find((r) => r.value === region)?.label || region.toUpperCase()}
                    </Badge>
                  </Group>
                  <Table striped highlightOnHover withTableBorder fz="sm">
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Server IP</Table.Th>
                        <Table.Th>Record Type</Table.Th>
                        <Table.Th>Status</Table.Th>
                        <Table.Th>Records</Table.Th>
                        <Table.Th>Latency</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {Object.entries(regionResults).flatMap(([ip, records]) =>
                        Object.entries(records).map(([rType, res]) => (
                          <Table.Tr key={`${ip}-${rType}`}>
                            <Table.Td>
                              <Text ff="monospace" fz="xs">
                                {ip}
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              <Badge variant="light" size="xs">
                                {rType}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Badge
                                variant="light"
                                color={
                                  res.status === 'ok'
                                    ? 'green'
                                    : res.status === 'timeout'
                                      ? 'yellow'
                                      : 'red'
                                }
                                size="xs"
                              >
                                {res.status}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Text fz="xs" ff="monospace">
                                {res.records?.join(', ') || res.error || '—'}
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              {res.latency_ms !== undefined ? `${res.latency_ms} ms` : '—'}
                            </Table.Td>
                          </Table.Tr>
                        ))
                      )}
                    </Table.Tbody>
                  </Table>
                  <Divider my="sm" />
                </Box>
              ))}
            </Paper>
          </Stack>
        )}
      </Stack>
    </ToolPageLayout>
  );
};
