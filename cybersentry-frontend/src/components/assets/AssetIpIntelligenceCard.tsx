import { Alert, Badge, Button, Code, Group, List, LoadingOverlay, Paper, SimpleGrid, Stack, Table, Text } from '@mantine/core';
import { IconAlertTriangle, IconExternalLink, IconRadar2 } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { ReportActionButtons } from '../reports/ReportActionButtons';
import { DashboardStatCards } from '../../layouts/dashboard/DashboardPageLayout';
import type { Asset, AssetRelatedContextResponse } from '../../services/assets';
import { downloadReport, type ReportExportFormat } from '../../utils/assets/assetScanExport';
import { printReport } from '../../utils/assets/assetScanPrint';
import { createAssetIpScanReport } from '../../utils/assets/assetScanReport';
import { formatDateTime, getRiskColor } from '../../utils/assets/assetDetail';
import { notifyError } from '../../utils/ui-notify';

type AssetIpIntelligenceCardProps = {
  asset: Asset;
  ipContext: AssetRelatedContextResponse['ip_reputation'];
  isLoading: boolean;
  isRunningIp: boolean;
  onRunIpReputation: () => void;
};

export const AssetIpIntelligenceCard = ({
  asset,
  ipContext,
  isLoading,
  isRunningIp,
  onRunIpReputation,
}: AssetIpIntelligenceCardProps) => {
  const handleReportAction = (
    entry: NonNullable<AssetRelatedContextResponse['ip_reputation']>['history'][number],
    action: 'print' | ReportExportFormat,
  ) => {
    try {
      const report = createAssetIpScanReport(asset, entry);

      if (action === 'print') {
        printReport(report);
        return;
      }

      downloadReport(report, action);
    } catch {
      notifyError(
        'Report action failed',
        `The IP scan report could not be ${action === 'print' ? 'opened for printing' : `exported as ${action.toUpperCase()}`}.`
      );
    }
  };

  return (
    <Paper p="lg" radius="xl" pos="relative">
      <LoadingOverlay visible={isLoading} />
      <Group justify="space-between" align="flex-start" mb="md">
        <div>
          <Text fw={800}>IP intelligence</Text>
          <Text size="sm" c="dimmed" mt={4}>
            Run reputation checks from the asset itself and review the scan trail tied to this IP.
          </Text>
        </div>
        <Group gap="sm">
          <Button
            variant="default"
            component={Link}
            to="/dashboard/ip-intelligence"
            leftSection={<IconExternalLink size={16} />}
          >
            Open IP intelligence
          </Button>
          <Button onClick={onRunIpReputation} leftSection={<IconRadar2 size={16} />} loading={isRunningIp}>
            Run reputation check
          </Button>
        </Group>
      </Group>

      {ipContext?.latest_scan ? (
        <Stack gap="lg">
          <DashboardStatCards
            items={[
              {
                label: 'Latest reputation',
                value: `${ipContext.latest_scan.reputation_score}/100`,
                hint: `Risk level: ${ipContext.latest_scan.risk_level}`,
              },
              {
                label: 'Last scanned',
                value: formatDateTime(ipContext.latest_scan.scanned_at),
              },
              {
                label: 'History entries',
                value: String(ipContext.history.length),
              },
              {
                label: 'Flags',
                value: [
                  ipContext.latest_scan.is_proxy ? 'Proxy' : null,
                  ipContext.latest_scan.is_hosting ? 'Hosting' : null,
                  ipContext.latest_scan.is_mobile ? 'Mobile' : null,
                ]
                  .filter(Boolean)
                  .join(', ') || 'None',
              },
            ]}
          />

        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
          <Paper p="md" radius="lg" withBorder>
            <Text fw={700} mb="md">
              Latest scan details
            </Text>
            <Stack gap="sm">
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  IP
                </Text>
                <Code>{ipContext.latest_scan.ip_address}</Code>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Country
                </Text>
                <Text>{ipContext.latest_scan.geolocation.country || 'N/A'}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  ISP
                </Text>
                <Text>{ipContext.latest_scan.network.isp || 'N/A'}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Reverse DNS
                </Text>
                <Text>{ipContext.latest_scan.network.reverse_dns || 'N/A'}</Text>
              </Group>
            </Stack>
          </Paper>

          <Paper p="md" radius="lg" withBorder>
            <Text fw={700} mb="md">
              Risk factors
            </Text>
            {ipContext.latest_scan.risk_factors.length > 0 ? (
              <List spacing="sm" icon={<IconAlertTriangle size={16} />}>
                {ipContext.latest_scan.risk_factors.map((factor) => (
                  <List.Item key={factor}>{factor}</List.Item>
                ))}
              </List>
            ) : (
              <Text c="dimmed">No risk factors were returned on the latest scan.</Text>
            )}
          </Paper>
        </SimpleGrid>

        <Paper p="md" radius="lg" withBorder>
          <Group justify="space-between" mb="md">
            <Text fw={700}>Recent IP scan history</Text>
            <Badge variant="light">{ipContext.history.length} entries</Badge>
          </Group>
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Score</Table.Th>
                <Table.Th>Risk</Table.Th>
                <Table.Th>Scanned at</Table.Th>
                <Table.Th style={{ textAlign: 'center' }}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {ipContext.history.map((entry) => (
                <Table.Tr key={entry.id}>
                  <Table.Td>
                    <Badge color={getRiskColor(entry.reputation_score)}>
                      {entry.reputation_score}/100
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light" tt="capitalize">
                      {entry.risk_level}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{formatDateTime(entry.scanned_at)}</Table.Td>
                  <Table.Td style={{ textAlign: 'center' }}>
                    <Group justify="center">
                      <ReportActionButtons
                        onPrint={() => handleReportAction(entry, 'print')}
                        onExport={(format) => handleReportAction(entry, format)}
                      />
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      </Stack>
    ) : (
      <Alert color="blue" variant="light" title="No IP intelligence yet">
        Run the first reputation check for this asset to populate linked intelligence and history.
      </Alert>
    )}
    </Paper>
  );
};
