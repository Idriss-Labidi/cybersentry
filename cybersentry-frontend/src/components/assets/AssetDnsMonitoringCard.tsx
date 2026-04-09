import {
  Alert,
  Badge,
  Button,
  Code,
  Divider,
  Group,
  LoadingOverlay,
  Paper,
  ScrollArea,
  SimpleGrid,
  Stack,
  Table,
  Text,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconExternalLink, IconWorld } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { ReportActionButtons } from '../reports/ReportActionButtons';
import DnsHealthResult from '../dns-intelligence/DnsHealthResult';
import { DashboardStatCards } from '../../layouts/dashboard/DashboardPageLayout';
import type { Asset, AssetRelatedContextResponse } from '../../services/assets';
import { downloadReport, type ReportExportFormat } from '../../utils/assets/assetScanExport';
import { printReport } from '../../utils/assets/assetScanPrint';
import { createAssetDnsHealthReport, createAssetDnsSnapshotReport } from '../../utils/assets/assetScanReport';
import {
  formatDateTime,
  formatDnsValues,
  getDnsStatusColor,
  getRiskColor,
  getSeverityColor,
} from '../../utils/assets/assetDetail';

type AssetDnsMonitoringCardProps = {
  asset: Asset;
  dnsContext: AssetRelatedContextResponse['dns_monitor'];
  isLoading: boolean;
  isRunningDns: boolean;
  onRunDnsMonitor: () => void;
};

export const AssetDnsMonitoringCard = ({
  asset,
  dnsContext,
  isLoading,
  isRunningDns,
  onRunDnsMonitor,
}: AssetDnsMonitoringCardProps) => {
  const latestSnapshot = dnsContext?.latest_snapshot;
  const latestHealthCheck = dnsContext?.latest_health_check;

  const handleSnapshotReportAction = (
    snapshot: NonNullable<AssetRelatedContextResponse['dns_monitor']>['snapshots'][number],
    action: 'print' | ReportExportFormat,
  ) => {
    try {
      const report = createAssetDnsSnapshotReport(asset, snapshot);

      if (action === 'print') {
        printReport(report);
        return;
      }

      downloadReport(report, action);
    } catch {
      notifications.show({
        color: 'red',
        title: 'Report action failed',
        message: `The DNS snapshot report could not be ${action === 'print' ? 'opened for printing' : `exported as ${action.toUpperCase()}`}.`,
      });
    }
  };

  const handleHealthReportAction = (
    entry: NonNullable<AssetRelatedContextResponse['dns_monitor']>['health_history'][number],
    action: 'print' | ReportExportFormat,
  ) => {
    try {
      const report = createAssetDnsHealthReport(asset, entry);

      if (action === 'print') {
        printReport(report);
        return;
      }

      downloadReport(report, action);
    } catch {
      notifications.show({
        color: 'red',
        title: 'Report action failed',
        message: `The DNS health report could not be ${action === 'print' ? 'opened for printing' : `exported as ${action.toUpperCase()}`}.`,
      });
    }
  };

  return (
    <Paper p="lg" radius="xl" pos="relative">
      <LoadingOverlay visible={isLoading} />
      <Group justify="space-between" align="flex-start" mb="md">
        <div>
          <Text fw={800}>DNS monitoring</Text>
          <Text size="sm" c="dimmed" mt={4}>
            Run a DNS snapshot and a DNS health check from the asset itself, then review drift, score, and alerts
            in one place.
          </Text>
        </div>
        <Group gap="sm">
          <Button
            variant="default"
            component={Link}
            to="/dashboard/dns-intelligence"
            leftSection={<IconExternalLink size={16} />}
          >
            Open DNS intelligence
          </Button>
          <Button onClick={onRunDnsMonitor} leftSection={<IconWorld size={16} />} loading={isRunningDns}>
            Run DNS monitor
          </Button>
        </Group>
      </Group>

      {latestSnapshot ? (
        <Stack gap="lg">
          <DashboardStatCards
            items={[
              {
                label: 'Latest monitor status',
                value: latestSnapshot.status === 'success' ? 'Healthy' : 'Failed',
                hint:
                  latestSnapshot.status === 'success'
                    ? 'DNS snapshot captured successfully.'
                    : latestSnapshot.error_message || 'DNS monitor could not resolve the domain.',
              },
              {
                label: 'Last monitored',
                value: formatDateTime(latestSnapshot.scanned_at),
              },
              {
                label: 'Latest DNS health',
                value: latestHealthCheck ? `${latestHealthCheck.score}/100` : 'Not run',
                hint: latestHealthCheck ? `Grade ${latestHealthCheck.grade}` : 'No DNS health check captured yet.',
              },
              {
                label: 'Recent changes',
                value: String(dnsContext.recent_changes.length),
                hint: dnsContext.recent_changes.length > 0 ? 'Detected across the latest snapshots.' : 'No DNS drift detected yet.',
              },
              {
                label: 'Active alerts',
                value: String(dnsContext.alerts.length),
                hint: dnsContext.alerts.length > 0 ? 'DNS change alerts generated for this domain.' : 'No DNS alerts for this asset yet.',
              },
            ]}
          />

          {latestSnapshot.status === 'failed' ? (
            <Alert color="red" variant="light" title="Latest DNS monitor failed">
              {latestSnapshot.error_message || 'The last DNS monitor run failed.'}
            </Alert>
          ) : null}

          <SimpleGrid cols={{ base: 1, xl: 2 }} spacing="lg">
            <Paper p="md" radius="lg" withBorder>
              <Group justify="space-between" mb="md">
                <Text fw={700}>Latest DNS snapshot</Text>
                <Badge color={getDnsStatusColor(latestSnapshot.status)} variant="light">
                  {latestSnapshot.status}
                </Badge>
              </Group>

              <ScrollArea type="auto" offsetScrollbars>
                <Table striped withTableBorder style={{ tableLayout: 'fixed', minWidth: 420 }}>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th style={{ width: 120 }}>Record type</Table.Th>
                      <Table.Th>Values</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {latestSnapshot.record_types.map((recordType) => (
                      <Table.Tr key={recordType}>
                        <Table.Td>
                          <Code>{recordType}</Code>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                            {formatDnsValues(latestSnapshot.records[recordType])}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            </Paper>

            <Paper p="md" radius="lg" withBorder>
              <Group justify="space-between" mb="md">
                <Text fw={700}>Recent DNS changes</Text>
                <Badge variant="light">{dnsContext.recent_changes.length} events</Badge>
              </Group>

              {dnsContext.recent_changes.length > 0 ? (
                <Stack gap="sm">
                  {dnsContext.recent_changes.map((change) => (
                    <Paper key={change.id} p="sm" radius="md" withBorder>
                      <Group justify="space-between" align="flex-start">
                        <div>
                          <Text fw={700}>{change.summary}</Text>
                          <Text size="sm" c="dimmed" mt={4}>
                            {formatDateTime(change.created_at)}
                          </Text>
                        </div>
                        <Group gap="xs">
                          <Badge variant="light">{change.record_type}</Badge>
                          <Badge color={getSeverityColor(change.severity)} variant="light">
                            {change.severity}
                          </Badge>
                        </Group>
                      </Group>
                      <Text size="sm" c="dimmed" mt="sm">
                        Before: {formatDnsValues(change.previous_value)}
                      </Text>
                      <Text size="sm" c="dimmed" mt={4}>
                        After: {formatDnsValues(change.current_value)}
                      </Text>
                    </Paper>
                  ))}
                </Stack>
              ) : (
                <Text c="dimmed">No DNS changes have been detected for this asset yet.</Text>
              )}
            </Paper>
          </SimpleGrid>

          {latestHealthCheck ? (
            <Paper p="md" radius="lg" withBorder>
              <Group justify="space-between" mb="md">
                <div>
                  <Text fw={700}>Latest DNS health check</Text>
                  <Text size="sm" c="dimmed" mt={4}>
                    This health score is also used to sync the current risk score of the asset.
                  </Text>
                </div>
                <Badge color={getRiskColor(latestHealthCheck.score)}>{latestHealthCheck.score}/100</Badge>
              </Group>
              <DnsHealthResult result={latestHealthCheck} scoreLabel="DNS Health Score" />
            </Paper>
          ) : null}

          <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
            <Paper p="md" radius="lg" withBorder>
              <Group justify="space-between" mb="md">
                <Text fw={700}>Recent alerts</Text>
                <Badge variant="light">{dnsContext.alerts.length} alerts</Badge>
              </Group>

              {dnsContext.alerts.length > 0 ? (
                <Stack gap="sm">
                  {dnsContext.alerts.map((alert) => (
                    <Alert key={alert.id} color={getSeverityColor(alert.severity)} variant="light" title={alert.title}>
                      <Text size="sm">{alert.detail}</Text>
                      <Text size="xs" c="dimmed" mt={8}>
                        {formatDateTime(alert.created_at)}
                      </Text>
                    </Alert>
                  ))}
                </Stack>
              ) : (
                <Text c="dimmed">No DNS alerts have been raised for this domain.</Text>
              )}
            </Paper>

            <Paper p="md" radius="lg" withBorder>
              <Group justify="space-between" mb="md">
                <Text fw={700}>DNS history</Text>
                <Badge variant="light">
                  {dnsContext.snapshots.length} snapshots / {dnsContext.health_history.length} health checks
                </Badge>
              </Group>

              <Table striped highlightOnHover withTableBorder>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Scanned at</Table.Th>
                    <Table.Th>Error</Table.Th>
                    <Table.Th style={{ textAlign: 'center' }}>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {dnsContext.snapshots.map((snapshot) => (
                    <Table.Tr key={snapshot.id}>
                      <Table.Td>
                        <Badge color={getDnsStatusColor(snapshot.status)} variant="light">
                          {snapshot.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td>{formatDateTime(snapshot.scanned_at)}</Table.Td>
                      <Table.Td>{snapshot.error_message || 'None'}</Table.Td>
                      <Table.Td style={{ textAlign: 'center' }}>
                        <Group justify="center">
                          <ReportActionButtons
                            onPrint={() => handleSnapshotReportAction(snapshot, 'print')}
                            onExport={(format) => handleSnapshotReportAction(snapshot, format)}
                            printTitle="Print snapshot report"
                          />
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>

              <Divider my="md" />

              <Text fw={700} mb="md">
                Health check history
              </Text>
              <Table striped highlightOnHover withTableBorder>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Score</Table.Th>
                    <Table.Th>Grade</Table.Th>
                    <Table.Th>Scanned at</Table.Th>
                    <Table.Th style={{ textAlign: 'center' }}>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {dnsContext.health_history.map((entry) => (
                    <Table.Tr key={entry.id}>
                      <Table.Td>
                        <Badge color={getRiskColor(entry.score)}>{entry.score}/100</Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="light">{entry.grade}</Badge>
                      </Table.Td>
                      <Table.Td>{formatDateTime(entry.scanned_at)}</Table.Td>                     
                      <Table.Td style={{ textAlign: 'center' }}>
                        <Group justify="center">
                          <ReportActionButtons
                            onPrint={() => handleHealthReportAction(entry, 'print')}
                            onExport={(format) => handleHealthReportAction(entry, format)}
                            printTitle="Print health report"
                          />
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
          </SimpleGrid>
        </Stack>
      ) : (
        <Alert color="blue" variant="light" title="No DNS monitoring data yet">
          Run the first DNS monitor for this domain asset to create a baseline snapshot and start detecting DNS drift.
        </Alert>
      )}
    </Paper>
  );
};
