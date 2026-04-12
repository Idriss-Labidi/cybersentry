import { ActionIcon, Alert, Badge, Button, Card, Center, Group, LoadingOverlay, Paper, ScrollArea, SimpleGrid, Stack, Table, Text, ThemeIcon, Title } from '@mantine/core';
import { IconAlertCircle, IconAlertTriangle, IconEye, IconFingerprint, IconHistory, IconTrash } from '@tabler/icons-react';
import { ReportActionButtons } from '../reports/ReportActionButtons';
import type { IPReputationScanHistory } from '../../services/ip-tools';
import type { ReportExportFormat } from '../../utils/assets/assetScanExport';
import { formatScanDate, riskColor } from '../../utils/ip-intelligence';

type IpHistorySectionProps = {
  scans: IPReputationScanHistory[];
  historyLoading: boolean;
  historyError: string | null;
  canLoadMore: boolean;
  deletingScanId: number | null;
  onLoadMore: () => void;
  onPrint: (scan: IPReputationScanHistory) => void;
  onExport: (scan: IPReputationScanHistory, format: ReportExportFormat) => void;
  onViewDetails: (scan: IPReputationScanHistory) => void;
  onDelete: (scanId: number) => void;
};

export default function IpHistorySection({
  scans,
  historyLoading,
  historyError,
  canLoadMore,
  deletingScanId,
  onLoadMore,
  onPrint,
  onExport,
  onViewDetails,
  onDelete,
}: IpHistorySectionProps) {
  return (
    <Stack gap="lg">
      <div>
        <Group gap="xs" mb="md">
          <IconHistory size={28} />
          <Title order={3}>Scan History</Title>
        </Group>
        <Text c="dimmed" fz="sm">
          View recent authenticated IP reputation scans and drill into the saved details.
        </Text>
      </div>

      {historyError ? (
        <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
          {historyError}
        </Alert>
      ) : null}

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
        <Card withBorder padding="lg" radius="md">
          <Group justify="space-between">
            <div>
              <Text fz="xs" c="dimmed" tt="uppercase" fw={700}>
                Loaded Scans
              </Text>
              <Text fz="xl" fw={700}>
                {scans.length}
              </Text>
            </div>
            <ThemeIcon size="lg" variant="light" color="blue">
              <IconFingerprint size={20} />
            </ThemeIcon>
          </Group>
        </Card>

        <Card withBorder padding="lg" radius="md">
          <Group justify="space-between">
            <div>
              <Text fz="xs" c="dimmed" tt="uppercase" fw={700}>
                High Risk IPs
              </Text>
              <Text fz="xl" fw={700}>
                {scans.filter((scan) => scan.risk_level === 'high').length}
              </Text>
            </div>
            <ThemeIcon size="lg" variant="light" color="red">
              <IconAlertTriangle size={20} />
            </ThemeIcon>
          </Group>
        </Card>
      </SimpleGrid>

      <Paper withBorder p="lg" radius="md" pos="relative">
        <LoadingOverlay visible={historyLoading} />

        {scans.length > 0 ? (
          <Stack gap="md">
            <ScrollArea>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>IP Address</Table.Th>
                    <Table.Th>Score</Table.Th>
                    <Table.Th>Risk Level</Table.Th>
                    <Table.Th>Scanned At</Table.Th>
                    <Table.Th style={{ textAlign: 'center' }}>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {scans.map((scan) => (
                    <Table.Tr key={scan.id}>
                      <Table.Td>
                        <Text fw={500}>{scan.ip_address}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="light" color={riskColor(scan.risk_level)}>
                          {scan.reputation_score}/100
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={riskColor(scan.risk_level)} tt="capitalize">
                          {scan.risk_level}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text fz="sm">{formatScanDate(scan.scanned_at)}</Text>
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'center' }}>
                        <Center>
                          <Group gap="xs" wrap="nowrap">
                            <ReportActionButtons
                              onPrint={() => onPrint(scan)}
                              onExport={(format) => onExport(scan, format)}
                            />
                            <ActionIcon
                              color="blue"
                              variant="light"
                              onClick={() => onViewDetails(scan)}
                              title="View details"
                            >
                              <IconEye size={16} />
                            </ActionIcon>
                            <ActionIcon
                              color="red"
                              variant="light"
                              onClick={() => onDelete(scan.id)}
                              title="Delete"
                              loading={deletingScanId === scan.id}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Group>
                        </Center>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>

            {canLoadMore ? (
              <Group justify="center">
                <Button variant="default" onClick={onLoadMore}>
                  Load more
                </Button>
              </Group>
            ) : null}
          </Stack>
        ) : (
          <Text c="dimmed" ta="center" py="xl">
            No scans yet. Perform a scan from the New Scan tab to start building your history.
          </Text>
        )}
      </Paper>
    </Stack>
  );
}
