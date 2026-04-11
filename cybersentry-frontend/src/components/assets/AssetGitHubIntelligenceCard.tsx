import { useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Code,
  Group,
  List,
  LoadingOverlay,
  Paper,
  SimpleGrid,
  Stack,
  Table,
  Text,
} from '@mantine/core';
import { IconAlertTriangle, IconBrandGithub, IconExternalLink } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { ReportActionButtons } from '../reports/ReportActionButtons';
import { DashboardStatCards } from '../../layouts/dashboard/DashboardPageLayout';
import { getRepositoryCheckResult } from '../../services/github-tools';
import type { Asset, AssetRelatedContextResponse, GitHubCheckResultDetail } from '../../services/assets';
import { downloadReport, type ReportExportFormat } from '../../utils/assets/assetScanExport';
import { printReport } from '../../utils/assets/assetScanPrint';
import { createAssetGitHubScanReport } from '../../utils/assets/assetScanReport';
import { formatDateTime, getRiskColor } from '../../utils/assets/assetDetail';
import { notifyError } from '../../utils/ui-notify';

type AssetGitHubIntelligenceCardProps = {
  asset: Asset;
  githubContext: AssetRelatedContextResponse['github_health'];
  isLoading: boolean;
  isRunningGitHub: boolean;
  onRunGitHubHealth: () => void;
};

export const AssetGitHubIntelligenceCard = ({
  asset,
  githubContext,
  isLoading,
  isRunningGitHub,
  onRunGitHubHealth,
}: AssetGitHubIntelligenceCardProps) => {
  const latestResult = githubContext?.latest_result;
  const [activeResultId, setActiveResultId] = useState<number | null>(null);

  const handleReportAction = async (resultId: number, action: 'print' | ReportExportFormat) => {
    setActiveResultId(resultId);

    try {
      const fullResult =
        latestResult?.id === resultId
          ? latestResult
          : (await getRepositoryCheckResult<GitHubCheckResultDetail>(resultId)).data;

      const report = createAssetGitHubScanReport(asset, fullResult);

      if (action === 'print') {
        printReport(report);
        return;
      }

      downloadReport(report, action);
    } catch {
      notifyError(
        'Report action failed',
        action === 'print'
          ? 'The full GitHub check could not be loaded for printing.'
          : `The full GitHub check could not be exported as ${action.toUpperCase()}.`
      );
    } finally {
      setActiveResultId(null);
    }
  };

  return (
    <Paper p="lg" radius="xl" pos="relative">
      <LoadingOverlay visible={isLoading} />
      <Group justify="space-between" align="flex-start" mb="md">
        <div>
          <Text fw={800}>GitHub intelligence</Text>
          <Text size="sm" c="dimmed" mt={4}>
            Launch repository health checks from the asset and keep the inventory linked to GitHub history.
          </Text>
        </div>
        <Group gap="sm">
          <Button
            variant="default"
            component={Link}
            to="/dashboard/github"
            leftSection={<IconExternalLink size={16} />}
          >
            Open GitHub health
          </Button>
          <Button onClick={onRunGitHubHealth} leftSection={<IconBrandGithub size={16} />} loading={isRunningGitHub}>
            Run GitHub health check
          </Button>
        </Group>
      </Group>

      {latestResult ? (
        <Stack gap="lg">
          <DashboardStatCards
            items={[
              {
                label: 'Latest risk',
                value: `${latestResult.risk_score}/100`,
                hint: latestResult.summary,
              },
              {
                label: 'Last checked',
                value: formatDateTime(latestResult.check_timestamp),
              },
              {
                label: 'Warnings',
                value: String(latestResult.warnings?.length ?? 0),
              },
              {
                label: 'History entries',
                value: String(githubContext?.history.length ?? 0),
              },
            ]}
          />

          <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
            <Paper p="md" radius="lg" withBorder>
              <Text fw={700} mb="md">
                Repository link
              </Text>
              <Stack gap="sm">
                <Group justify="space-between" align="flex-start">
                  <Text size="sm" c="dimmed">
                    Repository
                  </Text>
                  <Code>{latestResult.repository.url}</Code>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Owner
                  </Text>
                  <Text>{latestResult.repository.owner}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Name
                  </Text>
                  <Text>{latestResult.repository.name}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Last repository check
                  </Text>
                  <Text>{formatDateTime(latestResult.repository.last_check_at)}</Text>
                </Group>
              </Stack>
            </Paper>

            <Paper p="md" radius="lg" withBorder>
              <Text fw={700} mb="md">
                Latest warnings
              </Text>
              {latestResult.warnings && latestResult.warnings.length > 0 ? (
                <List spacing="sm" icon={<IconAlertTriangle size={16} />}>
                  {latestResult.warnings.map((warning, index) => (
                    <List.Item key={`${warning.category}-${index}`}>
                      <Text fw={600}>{warning.category}</Text>
                      <Text size="sm" c="dimmed">
                        {warning.message}
                      </Text>
                    </List.Item>
                  ))}
                </List>
              ) : (
                <Text c="dimmed">No warnings were returned on the latest repository check.</Text>
              )}
            </Paper>
          </SimpleGrid>

          <Paper p="md" radius="lg" withBorder>
            <Group justify="space-between" mb="md">
              <Text fw={700}>Recent GitHub health history</Text>
              <Badge variant="light">{githubContext?.history.length ?? 0} entries</Badge>
            </Group>
            <Table striped highlightOnHover withTableBorder>
              <Table.Thead>
              <Table.Tr>
                <Table.Th>Risk</Table.Th>
                <Table.Th>Summary</Table.Th>
                <Table.Th>Checked at</Table.Th>
                <Table.Th style={{ textAlign: 'center' }}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(githubContext?.history ?? []).map((entry) => (
                <Table.Tr key={entry.id}>
                    <Table.Td>
                      <Badge color={getRiskColor(entry.risk_score)}>{entry.risk_score}/100</Badge>
                  </Table.Td>
                  <Table.Td>{entry.summary}</Table.Td>
                  <Table.Td>{formatDateTime(entry.check_timestamp)}</Table.Td>
                  <Table.Td style={{ textAlign: 'center' }}>
                    <Group justify="center">
                      <ReportActionButtons
                        onPrint={() => void handleReportAction(entry.id, 'print')}
                        onExport={(format) => void handleReportAction(entry.id, format)}
                        loading={activeResultId === entry.id}
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
        <Alert color="blue" variant="light" title="No GitHub health data yet">
          Run the first repository health check for this asset to attach GitHub intelligence and history.
        </Alert>
      )}
    </Paper>
  );
};
