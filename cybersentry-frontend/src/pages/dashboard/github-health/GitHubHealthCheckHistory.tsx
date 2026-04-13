import { useEffect, useMemo, useState } from 'react';
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  Center,
  Group,
  Input,
  Loader,
  Modal,
  Paper,
  RingProgress,
  ScrollArea,
  SimpleGrid,
  Stack,
  Table,
  Text,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconCalendar,
  IconExternalLink,
  IconHistory,
  IconEye,
  IconLayoutKanban,
  IconList,
  IconRefresh,
  IconSearch,
  IconShield,
  IconTrash,
} from '@tabler/icons-react';
import type { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import { DashboardViewModeToggle } from '../../../components/dashboard/DashboardViewModeToggle';
import { ReportActionButtons } from '../../../components/reports/ReportActionButtons';
import GitHubCheckSections from '../../../components/github-health/GitHubCheckSections';
import { lookupAsset, type Asset, type AssetPayload } from '../../../services/assets';
import {
  deleteRepositoryCheckResult,
  getRepositoryCheckResult,
  getRepositoryHistory,
} from '../../../services/github-tools';
import { getRiskColor, getRiskLabel } from '../../../utils/githubHealthUtils';
import {
  formatGitHubHealthDate,
  normalizeHistoryEntry,
  type CheckResultDetail,
  type HistorySummary,
} from '../../../utils/githubHealthPage';
import { downloadReport, type ReportExportFormat } from '../../../utils/assets/assetScanExport';
import { printReport } from '../../../utils/assets/assetScanPrint';
import { createStandaloneGitHubScanReport } from '../../../utils/assets/assetScanReport';
import { notifyError, notifySuccess } from '../../../utils/ui-notify';

type GitHubHealthCheckHistoryProps = {
  refreshToken?: number;
};

const renderRingLabel = (value: number) => (
  <Text component="div" fw={700} ta="center" style={{ width: '100%' }}>
    {value}%
  </Text>
);

type GitHubHistoryViewProps = {
  entries: HistorySummary[];
  printingResultId: number | null;
  onReportAction: (resultId: number, action: 'print' | ReportExportFormat) => void;
  onView: (resultId: number) => void;
  onDelete: (resultId: number) => void;
};

type GitHubHistoryEntryActionsProps = {
  entryId: number;
  printingResultId: number | null;
  onReportAction: (resultId: number, action: 'print' | ReportExportFormat) => void;
  onView: (resultId: number) => void;
  onDelete: (resultId: number) => void;
};

const HISTORY_BOARD_COLUMNS: Array<{
  key: 'critical' | 'high' | 'medium' | 'low';
  label: string;
  color: string;
  matches: (entry: HistorySummary) => boolean;
}> = [
  { key: 'critical', label: 'Critical', color: 'red', matches: (entry) => entry.risk_score >= 75 },
  { key: 'high', label: 'High', color: 'orange', matches: (entry) => entry.risk_score >= 50 && entry.risk_score < 75 },
  { key: 'medium', label: 'Medium', color: 'yellow', matches: (entry) => entry.risk_score >= 25 && entry.risk_score < 50 },
  { key: 'low', label: 'Low', color: 'green', matches: (entry) => entry.risk_score < 25 },
];

function GitHubHistoryEntryActions({
  entryId,
  printingResultId,
  onReportAction,
  onView,
  onDelete,
}: GitHubHistoryEntryActionsProps) {
  return (
    <Group gap="xs" wrap="nowrap">
      <ReportActionButtons
        onPrint={() => onReportAction(entryId, 'print')}
        onExport={(format) => onReportAction(entryId, format)}
        loading={printingResultId === entryId}
      />
      <ActionIcon color="blue" variant="light" onClick={() => onView(entryId)} title="View details">
        <IconEye size={16} />
      </ActionIcon>
      <ActionIcon color="red" variant="light" onClick={() => onDelete(entryId)} title="Delete">
        <IconTrash size={16} />
      </ActionIcon>
    </Group>
  );
}

function GitHubHistoryTableView({
  entries,
  printingResultId,
  onReportAction,
  onView,
  onDelete,
}: GitHubHistoryViewProps) {
  return (
    <Card withBorder radius="md">
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Repository</Table.Th>
            <Table.Th>Risk</Table.Th>
            <Table.Th>Checked</Table.Th>
            <Table.Th style={{ textAlign: 'center' }}>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {entries.map((entry) => (
            <Table.Tr key={entry.id}>
              <Table.Td>
                <Text fw={700}>
                  {entry.repository.owner}/{entry.repository.name}
                </Text>
                <Text size="xs" c="dimmed">
                  {entry.repository.url}
                </Text>
              </Table.Td>
              <Table.Td>
                <Badge color={getRiskColor(entry.risk_score)}>{entry.risk_score}/100</Badge>
              </Table.Td>
              <Table.Td>
                <Group gap={6}>
                  <IconCalendar size={14} />
                  <Text size="sm">{formatGitHubHealthDate(entry.check_timestamp)}</Text>
                </Group>
              </Table.Td>
              <Table.Td style={{ textAlign: 'center' }}>
                <Center>
                  <GitHubHistoryEntryActions
                    entryId={entry.id}
                    printingResultId={printingResultId}
                    onReportAction={onReportAction}
                    onView={onView}
                    onDelete={onDelete}
                  />
                </Center>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Card>
  );
}

function GitHubHistoryListView({
  entries,
  printingResultId,
  onReportAction,
  onView,
  onDelete,
}: GitHubHistoryViewProps) {
  return (
    <Stack gap="md">
      {entries.map((entry) => (
        <Paper key={entry.id} p="lg" radius="md" withBorder>
          <Stack gap="md">
            <Group justify="space-between" align="flex-start" gap="md">
              <div>
                <Text fw={700}>
                  {entry.repository.owner}/{entry.repository.name}
                </Text>
                <Text size="sm" c="dimmed" mt={4}>
                  {entry.repository.url}
                </Text>
              </div>
              <Badge color={getRiskColor(entry.risk_score)}>
                {getRiskLabel(entry.risk_score)}
              </Badge>
            </Group>

            <Text size="sm" c="dimmed">
              {entry.summary}
            </Text>

            <Group justify="space-between" align="center" gap="md" wrap="wrap">
              <Group gap={6}>
                <IconCalendar size={14} />
                <Text size="sm">{formatGitHubHealthDate(entry.check_timestamp)}</Text>
              </Group>
              <GitHubHistoryEntryActions
                entryId={entry.id}
                printingResultId={printingResultId}
                onReportAction={onReportAction}
                onView={onView}
                onDelete={onDelete}
              />
            </Group>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}

function GitHubHistoryBoardView({
  entries,
  printingResultId,
  onReportAction,
  onView,
  onDelete,
}: GitHubHistoryViewProps) {
  return (
    <ScrollArea>
      <Group align="flex-start" gap="md" wrap="nowrap">
        {HISTORY_BOARD_COLUMNS.map((column) => {
          const columnEntries = entries.filter(column.matches);

          return (
            <Paper key={column.key} p="md" radius="lg" withBorder style={{ minWidth: 300, width: 300 }}>
              <Stack gap="md">
                <Group justify="space-between" align="center">
                  <Badge color={column.color}>{column.label}</Badge>
                  <Badge variant="light">{columnEntries.length}</Badge>
                </Group>

                <Stack gap="sm">
                  {columnEntries.length === 0 ? (
                    <Text size="sm" c="dimmed">
                      No checks in this lane.
                    </Text>
                  ) : (
                    columnEntries.map((entry) => (
                      <Paper key={entry.id} p="sm" radius="md" withBorder>
                        <Stack gap="sm">
                          <div>
                            <Text fw={700}>
                              {entry.repository.owner}/{entry.repository.name}
                            </Text>
                            <Text size="xs" c="dimmed" lineClamp={2}>
                              {entry.repository.url}
                            </Text>
                          </div>

                          <Text size="sm" c="dimmed">
                            {entry.summary}
                          </Text>

                          <Text size="xs" c="dimmed">
                            {formatGitHubHealthDate(entry.check_timestamp)}
                          </Text>

                          <GitHubHistoryEntryActions
                            entryId={entry.id}
                            printingResultId={printingResultId}
                            onReportAction={onReportAction}
                            onView={onView}
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

const GitHubHealthCheckHistory = ({ refreshToken = 0 }: GitHubHealthCheckHistoryProps) => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistorySummary[]>([]);
  const [historySearch, setHistorySearch] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'list' | 'board'>('table');
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<CheckResultDetail | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [printingResultId, setPrintingResultId] = useState<number | null>(null);
  const [selectedResultLinkedAsset, setSelectedResultLinkedAsset] = useState<Asset | null>(null);
  const [selectedResultAssetDefaults, setSelectedResultAssetDefaults] = useState<AssetPayload | null>(null);
  const [selectedResultAssetLookupLoading, setSelectedResultAssetLookupLoading] = useState(false);

  const loadHistory = async () => {
    setHistoryLoading(true);
    setHistoryError(null);

    try {
      const response = await getRepositoryHistory<Omit<HistorySummary, 'repository'>[]>({});
      setHistory(response.data.map(normalizeHistoryEntry));
    } catch (requestError: unknown) {
      const axiosError = requestError as AxiosError<{ error?: string }>;
      setHistoryError(axiosError.response?.data?.error ?? 'Failed to load GitHub history.');
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    void loadHistory();
  }, [refreshToken]);

  useEffect(() => {
    const repositoryUrl = selectedResult?.repository.url;
    if (!repositoryUrl) {
      setSelectedResultLinkedAsset(null);
      setSelectedResultAssetDefaults(null);
      return;
    }

    const loadSelectedResultLinkedAsset = async () => {
      setSelectedResultAssetLookupLoading(true);

      try {
        const response = await lookupAsset('github_repo', repositoryUrl, selectedResult.risk_score);
        setSelectedResultLinkedAsset(response.data.asset);
        setSelectedResultAssetDefaults(response.data.defaults);
      } catch {
        setSelectedResultLinkedAsset(null);
        setSelectedResultAssetDefaults(null);
      } finally {
        setSelectedResultAssetLookupLoading(false);
      }
    };

    void loadSelectedResultLinkedAsset();
  }, [selectedResult?.repository.url, selectedResult?.risk_score]);

  const handleViewHistoryResult = async (resultId: number) => {
    setDetailsLoading(true);

    try {
      const response = await getRepositoryCheckResult<CheckResultDetail>(resultId);
      setSelectedResult(response.data);
      setDetailsOpen(true);
    } catch (requestError: unknown) {
      const axiosError = requestError as AxiosError<{ error?: string }>;
      setHistoryError(axiosError.response?.data?.error ?? 'Failed to load check details.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDeleteHistoryResult = async (resultId: number) => {
    try {
      await deleteRepositoryCheckResult(resultId);
      setHistory((current) => current.filter((entry) => entry.id !== resultId));
      notifySuccess('GitHub scan deleted', 'The GitHub check result was removed from history.');

      if (selectedResult?.id === resultId) {
        setDetailsOpen(false);
        setSelectedResult(null);
      }
    } catch {
      setHistoryError('Failed to delete check result.');
      notifyError('GitHub deletion failed', 'The GitHub check result could not be deleted.');
    }
  };

  const handleReportAction = async (resultId: number, action: 'print' | ReportExportFormat) => {
    setPrintingResultId(resultId);

    try {
      const fullResult =
        selectedResult?.id === resultId ? selectedResult : (await getRepositoryCheckResult<CheckResultDetail>(resultId)).data;
      const report = createStandaloneGitHubScanReport(fullResult);

      if (action === 'print') {
        printReport(report);
        return;
      }

      downloadReport(report, action);
    } catch (requestError: unknown) {
      const axiosError = requestError as AxiosError<{ error?: string }>;
      const message =
        axiosError.response?.data?.error ??
        (action === 'print'
          ? 'The full GitHub check could not be loaded for printing.'
          : `The full GitHub check could not be exported as ${action.toUpperCase()}.`);

      notifyError('Report action failed', message);
    } finally {
      setPrintingResultId(null);
    }
  };

  const handleSaveSelectedResultAsAsset = () => {
    if (!selectedResultAssetDefaults) {
      return;
    }

    navigate('/dashboard/assets', {
      state: {
        prefillAsset: selectedResultAssetDefaults,
      },
    });
  };

  const filteredHistory = useMemo(() => {
    const search = historySearch.trim().toLowerCase();

    if (!search) {
      return history;
    }

    return history.filter((entry) => {
      const repository = `${entry.repository.owner}/${entry.repository.name}`.toLowerCase();
      return (
        repository.includes(search) ||
        entry.repository.url.toLowerCase().includes(search) ||
        entry.summary.toLowerCase().includes(search)
      );
    });
  }, [history, historySearch]);

  return (
    <>
      <Stack gap="lg">
        <Group justify="space-between" align="flex-end">
          <Input
            placeholder="Filter by repository, URL, or summary"
            leftSection={<IconSearch size={16} />}
            value={historySearch}
            onChange={(event) => setHistorySearch(event.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Button variant="light" leftSection={<IconRefresh size={16} />} onClick={() => void loadHistory()}>
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
        ) : filteredHistory.length > 0 ? (
          <>
            <SimpleGrid cols={{ base: 1, sm: 2, xl: 4 }} spacing="md">
              <Paper p="md" radius="md" withBorder>
                <Text size="xs" c="dimmed" fw={700}>
                  Total Checks
                </Text>
                <Text size="xl" fw={700}>
                  {filteredHistory.length}
                </Text>
              </Paper>
              <Paper p="md" radius="md" withBorder>
                <Text size="xs" c="dimmed" fw={700}>
                  Critical Risks
                </Text>
                <Text size="xl" fw={700} c="red">
                  {filteredHistory.filter((entry) => entry.risk_score >= 75).length}
                </Text>
              </Paper>
              <Paper p="md" radius="md" withBorder>
                <Text size="xs" c="dimmed" fw={700}>
                  Low Risk
                </Text>
                <Text size="xl" fw={700} c="green">
                  {filteredHistory.filter((entry) => entry.risk_score < 25).length}
                </Text>
              </Paper>
              <Paper p="md" radius="md" withBorder>
                <Text size="xs" c="dimmed" fw={700}>
                  Latest Check
                </Text>
                <Text size="sm" fw={700}>
                  {formatGitHubHealthDate(filteredHistory[0]?.check_timestamp)}
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
                <GitHubHistoryTableView
                  entries={filteredHistory}
                  printingResultId={printingResultId}
                  onReportAction={(resultId, action) => void handleReportAction(resultId, action)}
                  onView={(resultId) => void handleViewHistoryResult(resultId)}
                  onDelete={(resultId) => void handleDeleteHistoryResult(resultId)}
                />
              ) : null}

              {viewMode === 'list' ? (
                <GitHubHistoryListView
                  entries={filteredHistory}
                  printingResultId={printingResultId}
                  onReportAction={(resultId, action) => void handleReportAction(resultId, action)}
                  onView={(resultId) => void handleViewHistoryResult(resultId)}
                  onDelete={(resultId) => void handleDeleteHistoryResult(resultId)}
                />
              ) : null}

              {viewMode === 'board' ? (
                <GitHubHistoryBoardView
                  entries={filteredHistory}
                  printingResultId={printingResultId}
                  onReportAction={(resultId, action) => void handleReportAction(resultId, action)}
                  onView={(resultId) => void handleViewHistoryResult(resultId)}
                  onDelete={(resultId) => void handleDeleteHistoryResult(resultId)}
                />
              ) : null}
            </Stack>
          </>
        ) : (
          <Paper p="xl" radius="md" withBorder>
            <Center>
              <Stack gap="sm" align="center">
                <IconSearch size={42} />
                <Text fw={700}>No GitHub checks found</Text>
                <Text size="sm" c="dimmed" ta="center">
                  {historySearch ? 'Try adjusting the filter.' : 'Run the first repository check to build history.'}
                </Text>
              </Stack>
            </Center>
          </Paper>
        )}
      </Stack>

      <Modal
        opened={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        title={selectedResult ? `${selectedResult.repository.owner}/${selectedResult.repository.name}` : 'Check details'}
        size="xl"
      >
        {detailsLoading ? (
          <Center py="xl">
            <Loader />
          </Center>
        ) : selectedResult ? (
          <Stack gap="lg">
            <Paper p="lg" radius="md" withBorder>
              <Group justify="space-between" mb="md">
                <div>
                  <Text fw={700}>{selectedResult.repository.url}</Text>
                  <Text size="sm" c="dimmed" mt={4}>
                    {selectedResult.summary}
                  </Text>
                </div>
                <Badge size="lg" color={getRiskColor(selectedResult.risk_score)}>
                  {getRiskLabel(selectedResult.risk_score)}
                </Badge>
              </Group>

              <Group gap="sm" mb="md">
                {selectedResultLinkedAsset ? (
                  <Button
                    variant="light"
                    onClick={() => navigate(`/dashboard/assets/${selectedResultLinkedAsset.id}`)}
                    leftSection={<IconExternalLink size={16} />}
                  >
                    Open linked asset
                  </Button>
                ) : selectedResultAssetDefaults ? (
                  <Button
                    variant="light"
                    onClick={handleSaveSelectedResultAsAsset}
                    leftSection={<IconShield size={16} />}
                  >
                    Save as asset
                  </Button>
                ) : null}
                {selectedResultAssetLookupLoading ? (
                  <Text size="sm" c="dimmed">
                    Checking asset inventory link...
                  </Text>
                ) : null}
              </Group>

              <Center>
                <RingProgress
                  sections={[{ value: selectedResult.risk_score, color: getRiskColor(selectedResult.risk_score) }]}
                  label={renderRingLabel(selectedResult.risk_score)}
                  size={110}
                />
              </Center>
            </Paper>
            <GitHubCheckSections detail={selectedResult} />
          </Stack>
        ) : null}
      </Modal>
    </>
  );
};

export default GitHubHealthCheckHistory;
