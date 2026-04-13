import { useState } from 'react';
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Center,
  Group,
  Loader,
  Paper,
  ScrollArea,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconEye,
  IconHistory,
  IconLayoutKanban,
  IconList,
  IconRefresh,
  IconTrash,
} from '@tabler/icons-react';
import { DashboardViewModeToggle } from '../dashboard/DashboardViewModeToggle';
import { ReportActionButtons } from '../reports/ReportActionButtons';
import type { DnsHealthHistoryEntry } from '../../services/dns-tools';
import type { ReportExportFormat } from '../../utils/assets/assetScanExport';

type DnsHealthHistorySectionProps = {
  history: DnsHealthHistoryEntry[];
  historyLoading: boolean;
  historyError: string | null;
  deletingScanId: number | null;
  onRefresh: () => void;
  onReportAction: (entry: DnsHealthHistoryEntry, action: 'print' | ReportExportFormat) => void;
  onViewDetails: (entry: DnsHealthHistoryEntry) => void;
  onDelete: (scanId: number) => void;
};

type DnsHistoryViewProps = {
  history: DnsHealthHistoryEntry[];
  deletingScanId: number | null;
  onReportAction: (entry: DnsHealthHistoryEntry, action: 'print' | ReportExportFormat) => void;
  onViewDetails: (entry: DnsHealthHistoryEntry) => void;
  onDelete: (scanId: number) => void;
};

type DnsHistoryActionsProps = {
  entry: DnsHealthHistoryEntry;
  deletingScanId: number | null;
  onReportAction: (entry: DnsHealthHistoryEntry, action: 'print' | ReportExportFormat) => void;
  onViewDetails: (entry: DnsHealthHistoryEntry) => void;
  onDelete: (scanId: number) => void;
};

const DNS_HISTORY_BOARD_COLUMNS = [
  {
    key: 'healthy',
    label: 'Healthy',
    color: 'green',
    matches: (entry: DnsHealthHistoryEntry) => ['A', 'B'].includes(entry.grade.toUpperCase()),
  },
  {
    key: 'watch',
    label: 'Watch',
    color: 'yellow',
    matches: (entry: DnsHealthHistoryEntry) => entry.grade.toUpperCase() === 'C',
  },
  {
    key: 'critical',
    label: 'Critical',
    color: 'red',
    matches: (entry: DnsHealthHistoryEntry) => !['A', 'B', 'C'].includes(entry.grade.toUpperCase()),
  },
] as const;

const gradeColor = (grade: string) => {
  switch (grade.toUpperCase()) {
    case 'A':
      return 'green';
    case 'B':
      return 'teal';
    case 'C':
      return 'yellow';
    case 'D':
      return 'orange';
    case 'F':
      return 'red';
    default:
      return 'gray';
  }
};

const formatDate = (value?: string | null) => {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleString();
};

function getRecommendationLabel(entry: DnsHealthHistoryEntry) {
  const count = entry.recommendations.length;
  return count === 1 ? '1 recommendation' : `${count} recommendations`;
}

function DnsHistoryEntryActions({
  entry,
  deletingScanId,
  onReportAction,
  onViewDetails,
  onDelete,
}: DnsHistoryActionsProps) {
  return (
    <Group gap="xs" wrap="nowrap">
      <ReportActionButtons
        onPrint={() => onReportAction(entry, 'print')}
        onExport={(format) => onReportAction(entry, format)}
      />
      <ActionIcon color="blue" variant="light" title="View details" onClick={() => onViewDetails(entry)}>
        <IconEye size={16} />
      </ActionIcon>
      <ActionIcon
        color="red"
        variant="light"
        title="Delete"
        loading={deletingScanId === entry.id}
        onClick={() => onDelete(entry.id)}
      >
        <IconTrash size={16} />
      </ActionIcon>
    </Group>
  );
}

function DnsHistoryTableView({
  history,
  deletingScanId,
  onReportAction,
  onViewDetails,
  onDelete,
}: DnsHistoryViewProps) {
  return (
    <Paper p="md" radius="md" withBorder>
      <ScrollArea>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Domain</Table.Th>
              <Table.Th>Score</Table.Th>
              <Table.Th>Grade</Table.Th>
              <Table.Th>Scanned</Table.Th>
              <Table.Th style={{ textAlign: 'center' }}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {history.map((entry) => (
              <Table.Tr key={entry.id}>
                <Table.Td>
                  <Text fw={700}>{entry.domain_name}</Text>
                </Table.Td>
                <Table.Td>
                  <Badge color={gradeColor(entry.grade)}>{entry.score}/100</Badge>
                </Table.Td>
                <Table.Td>
                  <Badge variant="light" color={gradeColor(entry.grade)}>
                    {entry.grade}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{formatDate(entry.scanned_at)}</Text>
                </Table.Td>
                <Table.Td style={{ textAlign: 'center' }}>
                  <Center>
                    <DnsHistoryEntryActions
                      entry={entry}
                      deletingScanId={deletingScanId}
                      onReportAction={onReportAction}
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
    </Paper>
  );
}

function DnsHistoryListView({
  history,
  deletingScanId,
  onReportAction,
  onViewDetails,
  onDelete,
}: DnsHistoryViewProps) {
  return (
    <Stack gap="md">
      {history.map((entry) => (
        <Paper key={entry.id} p="lg" radius="md" withBorder>
          <Stack gap="md">
            <Group justify="space-between" align="flex-start" gap="md">
              <div>
                <Text fw={700}>{entry.domain_name}</Text>
                <Text size="sm" c="dimmed" mt={4}>
                  {getRecommendationLabel(entry)}
                </Text>
              </div>
              <Group gap={6}>
                <Badge color={gradeColor(entry.grade)}>{entry.score}/100</Badge>
                <Badge variant="light" color={gradeColor(entry.grade)}>
                  {entry.grade}
                </Badge>
              </Group>
            </Group>

            <Text size="sm" c="dimmed">
              Scanned {formatDate(entry.scanned_at)}
            </Text>

            <Group justify="space-between" align="center" gap="md" wrap="wrap">
              <Text size="sm" c="dimmed">
                {Object.keys(entry.checks).length} checks evaluated
              </Text>
              <DnsHistoryEntryActions
                entry={entry}
                deletingScanId={deletingScanId}
                onReportAction={onReportAction}
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

function DnsHistoryBoardView({
  history,
  deletingScanId,
  onReportAction,
  onViewDetails,
  onDelete,
}: DnsHistoryViewProps) {
  return (
    <ScrollArea>
      <Group align="flex-start" gap="md" wrap="nowrap">
        {DNS_HISTORY_BOARD_COLUMNS.map((column) => {
          const entries = history.filter(column.matches);

          return (
            <Paper key={column.key} p="md" radius="lg" withBorder style={{ minWidth: 300, width: 300 }}>
              <Stack gap="md">
                <Group justify="space-between" align="center">
                  <Badge color={column.color}>{column.label}</Badge>
                  <Badge variant="light">{entries.length}</Badge>
                </Group>

                <Stack gap="sm">
                  {entries.length === 0 ? (
                    <Text size="sm" c="dimmed">
                      No scans in this lane.
                    </Text>
                  ) : (
                    entries.map((entry) => (
                      <Paper key={entry.id} p="sm" radius="md" withBorder>
                        <Stack gap="sm">
                          <Group justify="space-between" align="flex-start" wrap="nowrap">
                            <div>
                              <Text fw={700}>{entry.domain_name}</Text>
                              <Text size="xs" c="dimmed" mt={4}>
                                {formatDate(entry.scanned_at)}
                              </Text>
                            </div>
                            <Badge color={gradeColor(entry.grade)}>{entry.grade}</Badge>
                          </Group>

                          <Text size="sm" c="dimmed">
                            {entry.score}/100 score
                          </Text>

                          <Text size="xs" c="dimmed">
                            {getRecommendationLabel(entry)}
                          </Text>

                          <DnsHistoryEntryActions
                            entry={entry}
                            deletingScanId={deletingScanId}
                            onReportAction={onReportAction}
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

export default function DnsHealthHistorySection({
  history,
  historyLoading,
  historyError,
  deletingScanId,
  onRefresh,
  onReportAction,
  onViewDetails,
  onDelete,
}: DnsHealthHistorySectionProps) {
  const [viewMode, setViewMode] = useState<'table' | 'list' | 'board'>('table');

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <div>
          <Title order={4}>DNS Health History</Title>
          <Text size="sm" c="dimmed">
            Review saved DNS health scans for authenticated runs.
          </Text>
        </div>
        <Button variant="light" leftSection={<IconRefresh size={16} />} onClick={onRefresh}>
          Refresh history
        </Button>
      </Group>

      {historyError ? (
        <Alert icon={<IconAlertCircle size={16} />} color="red">
          {historyError}
        </Alert>
      ) : null}

      {historyLoading ? (
        <Center py="xl">
          <Loader />
        </Center>
      ) : history.length > 0 ? (
        <>
          <SimpleGrid cols={{ base: 1, sm: 2, xl: 4 }} spacing="md">
            <Paper p="md" radius="md" withBorder>
              <Text size="xs" c="dimmed" fw={700}>
                Total Scans
              </Text>
              <Text size="xl" fw={700}>
                {history.length}
              </Text>
            </Paper>
            <Paper p="md" radius="md" withBorder>
              <Text size="xs" c="dimmed" fw={700}>
                High Risk Domains
              </Text>
              <Text size="xl" fw={700} c="red">
                {history.filter((entry) => entry.score < 60).length}
              </Text>
            </Paper>
            <Paper p="md" radius="md" withBorder>
              <Text size="xs" c="dimmed" fw={700}>
                Best Grade
              </Text>
              <Text size="xl" fw={700}>
                {history.find((entry) => entry.grade === 'A') ? 'A' : history[0]?.grade ?? '--'}
              </Text>
            </Paper>
            <Paper p="md" radius="md" withBorder>
              <Text size="xs" c="dimmed" fw={700}>
                Latest Scan
              </Text>
              <Text size="sm" fw={700}>
                {formatDate(history[0]?.scanned_at)}
              </Text>
            </Paper>
          </SimpleGrid>

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
              <DnsHistoryTableView
                history={history}
                deletingScanId={deletingScanId}
                onReportAction={onReportAction}
                onViewDetails={onViewDetails}
                onDelete={onDelete}
              />
            ) : null}

            {viewMode === 'list' ? (
              <DnsHistoryListView
                history={history}
                deletingScanId={deletingScanId}
                onReportAction={onReportAction}
                onViewDetails={onViewDetails}
                onDelete={onDelete}
              />
            ) : null}

            {viewMode === 'board' ? (
              <DnsHistoryBoardView
                history={history}
                deletingScanId={deletingScanId}
                onReportAction={onReportAction}
                onViewDetails={onViewDetails}
                onDelete={onDelete}
              />
            ) : null}
          </Stack>
        </>
      ) : (
        <Paper p="xl" radius="md" withBorder>
          <Center>
            <Stack gap="sm" align="center">
              <IconHistory size={42} />
              <Text fw={700}>No DNS history yet</Text>
              <Text size="sm" c="dimmed" ta="center">
                Run a DNS health check while authenticated to build history.
              </Text>
            </Stack>
          </Center>
        </Paper>
      )}
    </Stack>
  );
}
