import { useState } from 'react';
import { ActionIcon, Alert, Badge, Button, Card, Center, Group, LoadingOverlay, Paper, ScrollArea, SimpleGrid, Stack, Table, Text, ThemeIcon, Title } from '@mantine/core';
import { IconAlertCircle, IconAlertTriangle, IconEye, IconFingerprint, IconHistory, IconLayoutKanban, IconList, IconTrash } from '@tabler/icons-react';
import { DashboardViewModeToggle } from '../dashboard/DashboardViewModeToggle';
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

type IpHistoryViewProps = {
  scans: IPReputationScanHistory[];
  deletingScanId: number | null;
  onPrint: (scan: IPReputationScanHistory) => void;
  onExport: (scan: IPReputationScanHistory, format: ReportExportFormat) => void;
  onViewDetails: (scan: IPReputationScanHistory) => void;
  onDelete: (scanId: number) => void;
};

type IpHistoryActionsProps = {
  scan: IPReputationScanHistory;
  deletingScanId: number | null;
  onPrint: (scan: IPReputationScanHistory) => void;
  onExport: (scan: IPReputationScanHistory, format: ReportExportFormat) => void;
  onViewDetails: (scan: IPReputationScanHistory) => void;
  onDelete: (scanId: number) => void;
};

const IP_HISTORY_BOARD_COLUMNS: Array<{
  key: IPReputationScanHistory['risk_level'];
  label: string;
}> = [
  { key: 'high', label: 'High Risk' },
  { key: 'medium', label: 'Medium Risk' },
  { key: 'low', label: 'Low Risk' },
];

function getFlagLabel(scan: IPReputationScanHistory) {
  const flags = [
    scan.is_proxy ? 'Proxy' : null,
    scan.is_hosting ? 'Hosting' : null,
    scan.is_mobile ? 'Mobile' : null,
  ].filter(Boolean);

  return flags.length > 0 ? flags.join(' | ') : 'No infrastructure flags';
}

function IpHistoryEntryActions({
  scan,
  deletingScanId,
  onPrint,
  onExport,
  onViewDetails,
  onDelete,
}: IpHistoryActionsProps) {
  return (
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
  );
}

function IpHistoryTableView({
  scans,
  deletingScanId,
  onPrint,
  onExport,
  onViewDetails,
  onDelete,
}: IpHistoryViewProps) {
  return (
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
                  <IpHistoryEntryActions
                    scan={scan}
                    deletingScanId={deletingScanId}
                    onPrint={onPrint}
                    onExport={onExport}
                    onViewDetails={onViewDetails}
                    onDelete={onDelete}
                  />
                </Center>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
}

function IpHistoryListView({
  scans,
  deletingScanId,
  onPrint,
  onExport,
  onViewDetails,
  onDelete,
}: IpHistoryViewProps) {
  return (
    <Stack gap="md">
      {scans.map((scan) => (
        <Paper key={scan.id} p="lg" radius="md" withBorder>
          <Stack gap="md">
            <Group justify="space-between" align="flex-start" gap="md">
              <div>
                <Text fw={700}>{scan.ip_address}</Text>
                <Text size="sm" c="dimmed" mt={4}>
                  {scan.network.org ?? scan.network.isp ?? 'Network details unavailable'}
                </Text>
              </div>
              <Group gap={6}>
                <Badge variant="light" color={riskColor(scan.risk_level)}>
                  {scan.reputation_score}/100
                </Badge>
                <Badge color={riskColor(scan.risk_level)} tt="capitalize">
                  {scan.risk_level}
                </Badge>
              </Group>
            </Group>

            <Text size="sm" c="dimmed">
              {getFlagLabel(scan)}
            </Text>

            <Group justify="space-between" align="center" gap="md" wrap="wrap">
              <Text size="sm" c="dimmed">
                Scanned {formatScanDate(scan.scanned_at)}
              </Text>
              <IpHistoryEntryActions
                scan={scan}
                deletingScanId={deletingScanId}
                onPrint={onPrint}
                onExport={onExport}
                onViewDetails={onViewDetails}
                onDelete={onDelete}
              />
            </Group>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}

function IpHistoryBoardView({
  scans,
  deletingScanId,
  onPrint,
  onExport,
  onViewDetails,
  onDelete,
}: IpHistoryViewProps) {
  return (
    <ScrollArea>
      <Group align="flex-start" gap="md" wrap="nowrap">
        {IP_HISTORY_BOARD_COLUMNS.map((column) => {
          const columnScans = scans.filter((scan) => scan.risk_level === column.key);

          return (
            <Paper key={column.key} p="md" radius="lg" withBorder style={{ minWidth: 300, width: 300 }}>
              <Stack gap="md">
                <Group justify="space-between" align="center">
                  <Badge color={riskColor(column.key)}>{column.label}</Badge>
                  <Badge variant="light">{columnScans.length}</Badge>
                </Group>

                <Stack gap="sm">
                  {columnScans.length === 0 ? (
                    <Text size="sm" c="dimmed">
                      No scans in this lane.
                    </Text>
                  ) : (
                    columnScans.map((scan) => (
                      <Paper key={scan.id} p="sm" radius="md" withBorder>
                        <Stack gap="sm">
                          <Group justify="space-between" align="flex-start" wrap="nowrap">
                            <div>
                              <Text fw={700}>{scan.ip_address}</Text>
                              <Text size="xs" c="dimmed" mt={4}>
                                {formatScanDate(scan.scanned_at)}
                              </Text>
                            </div>
                            <Badge variant="light" color={riskColor(scan.risk_level)}>
                              {scan.reputation_score}/100
                            </Badge>
                          </Group>

                          <Text size="sm" c="dimmed">
                            {getFlagLabel(scan)}
                          </Text>

                          <IpHistoryEntryActions
                            scan={scan}
                            deletingScanId={deletingScanId}
                            onPrint={onPrint}
                            onExport={onExport}
                            onViewDetails={onViewDetails}
                            onDelete={onDelete}
                          />
                        </Stack>
                      </Paper>
                    ))
                  )}
                </Stack>
              </Stack>
            </Paper>
          );
        })}
      </Group>
    </ScrollArea>
  );
}

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
  const [viewMode, setViewMode] = useState<'table' | 'list' | 'board'>('table');

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
            <DashboardViewModeToggle
              value={viewMode}
              onChange={(value) => setViewMode(value as 'table' | 'list' | 'board')}
              options={[
                { label: 'Table', value: 'table', leftSection: <IconList size={14} /> },
                { label: 'List', value: 'list', leftSection: <IconHistory size={14} /> },
                { label: 'Board', value: 'board', leftSection: <IconLayoutKanban size={14} /> },
              ]}
            />

            {viewMode === 'table' ? (
              <IpHistoryTableView
                scans={scans}
                deletingScanId={deletingScanId}
                onPrint={onPrint}
                onExport={onExport}
                onViewDetails={onViewDetails}
                onDelete={onDelete}
              />
            ) : null}

            {viewMode === 'list' ? (
              <IpHistoryListView
                scans={scans}
                deletingScanId={deletingScanId}
                onPrint={onPrint}
                onExport={onExport}
                onViewDetails={onViewDetails}
                onDelete={onDelete}
              />
            ) : null}

            {viewMode === 'board' ? (
              <IpHistoryBoardView
                scans={scans}
                deletingScanId={deletingScanId}
                onPrint={onPrint}
                onExport={onExport}
                onViewDetails={onViewDetails}
                onDelete={onDelete}
              />
            ) : null}

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
