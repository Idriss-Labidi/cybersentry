import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Code,
  Divider,
  Group,
  List,
  LoadingOverlay,
  Paper,
  SimpleGrid,
  Stack,
  Table,
  Text,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconBrandGithub,
  IconExternalLink,
  IconRadar2,
  IconRefresh,
  IconServer2,
} from '@tabler/icons-react';
import { Link, useParams } from 'react-router-dom';
import { useDashboardBreadcrumb } from '../../../layouts/dashboard/DashboardBreadcrumbContext';
import DashboardPageLayout, { DashboardStatCards } from '../../../layouts/dashboard/DashboardPageLayout';
import {
  getAsset,
  getAssetRelatedContext,
  getAssetRiskHistory,
  runAssetGitHubHealth,
  runAssetIpReputation,
  type Asset,
  type AssetCategory,
  type AssetRelatedContextResponse,
  type AssetRiskHistoryEntry,
  type AssetStatus,
} from '../../../services/assets';
import { getApiErrorMessage } from '../../../utils/api-error';

const getRiskColor = (score: number) => {
  if (score >= 70) {
    return 'red';
  }

  if (score >= 40) {
    return 'yellow';
  }

  return 'green';
};

const getCategoryColor = (category: AssetCategory) => {
  if (category === 'production') {
    return 'red';
  }

  if (category === 'development') {
    return 'blue';
  }

  return 'gray';
};

const getStatusColor = (status: AssetStatus) => {
  if (status === 'active') {
    return 'green';
  }

  if (status === 'paused') {
    return 'yellow';
  }

  return 'gray';
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleString();
};

const riskSourceLabel = (entry: AssetRiskHistoryEntry) => entry.note || entry.source || 'Snapshot';

export const AssetDetail = () => {
  const { id } = useParams();
  const { setCurrentLabel } = useDashboardBreadcrumb();
  const assetId = Number(id);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [riskHistory, setRiskHistory] = useState<AssetRiskHistoryEntry[]>([]);
  const [relatedContext, setRelatedContext] = useState<AssetRelatedContextResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningIp, setIsRunningIp] = useState(false);
  const [isRunningGitHub, setIsRunningGitHub] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAssetData = async () => {
    if (!Number.isFinite(assetId)) {
      setError('Invalid asset id.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [assetResponse, historyResponse, relatedContextResponse] = await Promise.all([
        getAsset(assetId),
        getAssetRiskHistory(assetId),
        getAssetRelatedContext(assetId),
      ]);

      setAsset(assetResponse.data);
      setRiskHistory(historyResponse.data.entries);
      setRelatedContext(relatedContextResponse.data);
    } catch (loadError: unknown) {
      setError(getApiErrorMessage(loadError, [], 'Failed to load asset details.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAssetData();
  }, [assetId]);

  useEffect(() => {
    setCurrentLabel(asset?.name ?? null);

    return () => {
      setCurrentLabel(null);
    };
  }, [asset?.name, setCurrentLabel]);

  const metrics = useMemo(() => {
    if (!asset) {
      return [];
    }

    return [
      {
        label: 'Current baseline risk',
        value: `${asset.risk_score}/100`,
        hint: 'Manual baseline score until automated scoring is introduced.',
      },
      {
        label: 'Last scan',
        value: asset.last_scanned_at ? 'Available' : 'Pending',
        hint: formatDateTime(asset.last_scanned_at),
      },
      {
        label: 'Risk snapshots',
        value: String(riskHistory.length),
        hint: 'Historical baseline score checkpoints for this asset.',
      },
    ];
  }, [asset, riskHistory.length]);

  const handleRunIpReputation = async () => {
    if (!asset) {
      return;
    }

    setIsRunningIp(true);
    setError(null);

    try {
      await runAssetIpReputation(asset.id);
      await loadAssetData();
    } catch (runError: unknown) {
      setError(getApiErrorMessage(runError, [], 'Failed to run IP reputation check.'));
    } finally {
      setIsRunningIp(false);
    }
  };

  const handleRunGitHubHealth = async () => {
    if (!asset) {
      return;
    }

    setIsRunningGitHub(true);
    setError(null);

    try {
      await runAssetGitHubHealth(asset.id);
      await loadAssetData();
    } catch (runError: unknown) {
      setError(getApiErrorMessage(runError, [], 'Failed to run GitHub health check.'));
    } finally {
      setIsRunningGitHub(false);
    }
  };

  const renderRiskHistory = () => (
    <Paper p="lg" radius="xl" pos="relative">
      <LoadingOverlay visible={isLoading} />
      <Group justify="space-between" align="flex-start" mb="md">
        <div>
          <Text fw={800}>Risk history</Text>
          <Text size="sm" c="dimmed" mt={4}>
            The current score remains a manual baseline for this phase, but every change is still tracked over time.
          </Text>
        </div>
        <Badge variant="light">{riskHistory.length} entries</Badge>
      </Group>

      {riskHistory.length === 0 ? (
        <Text c="dimmed">No risk snapshots recorded yet for this asset.</Text>
      ) : (
        <Stack gap="sm">
          {riskHistory.map((entry) => (
            <Paper key={entry.id} p="md" radius="lg" withBorder>
              <Group justify="space-between" align="flex-start">
                <div>
                  <Text fw={700}>{riskSourceLabel(entry)}</Text>
                  <Text size="sm" c="dimmed" mt={4}>
                    {formatDateTime(entry.calculated_at)}
                  </Text>
                </div>
                <Badge color={getRiskColor(entry.score)}>{entry.score}/100</Badge>
              </Group>
            </Paper>
          ))}
        </Stack>
      )}
    </Paper>
  );

  const renderIpIntelligence = () => {
    const ipContext = relatedContext?.ip_reputation;

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
            <Button
              onClick={() => void handleRunIpReputation()}
              leftSection={<IconRadar2 size={16} />}
              loading={isRunningIp}
            >
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

  const renderGitHubIntelligence = () => {
    const githubContext = relatedContext?.github_health;
    const latestResult = githubContext?.latest_result;

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
            <Button
              onClick={() => void handleRunGitHubHealth()}
              leftSection={<IconBrandGithub size={16} />}
              loading={isRunningGitHub}
            >
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

  const renderAutomationPlaceholder = () => (
    <Paper p="lg" radius="xl">
      <Text fw={800} mb="sm">
        Related intelligence
      </Text>
      <Alert color="blue" variant="light" title="Next automation target">
        {relatedContext?.message ||
          'This asset type is already inventoried, but automated DNS and website monitoring will be added in the next phase.'}
      </Alert>
    </Paper>
  );

  return (
    <DashboardPageLayout
      icon={<IconServer2 size={26} />}
      eyebrow="Assets"
      title={asset?.name ?? 'Asset detail'}
      description={
        asset
          ? `Central asset view for ${asset.value} with its baseline risk history and linked intelligence.`
          : 'Loading asset details and linked intelligence.'
      }
      metrics={metrics}
      actions={
        <Group gap="sm">
          <Button
            variant="default"
            component={Link}
            to="/dashboard/assets"
            leftSection={<IconArrowLeft size={16} />}
          >
            Back to assets
          </Button>
          <Button variant="light" onClick={() => void loadAssetData()} leftSection={<IconRefresh size={16} />}>
            Refresh
          </Button>
        </Group>
      }
    >
      {error ? (
        <Alert color="red" variant="light" title="Asset detail unavailable">
          {error}
        </Alert>
      ) : null}

      <Paper p="lg" radius="xl" pos="relative">
        <LoadingOverlay visible={isLoading} />

        {asset ? (
          <Stack gap="lg">
            <Group justify="space-between" align="flex-start">
              <div>
                <Text fw={800} size="lg">
                  {asset.name}
                </Text>
                <Text size="sm" c="dimmed" mt={4}>
                  {asset.description || 'No description has been added for this asset yet.'}
                </Text>
              </div>
              <Group gap="sm">
                <Badge variant="light">{asset.asset_type_label}</Badge>
                <Badge color={getCategoryColor(asset.category)} variant="light">
                  {asset.category_label}
                </Badge>
                <Badge color={getStatusColor(asset.status)} variant="light">
                  {asset.status_label}
                </Badge>
                <Badge color={getRiskColor(asset.risk_score)}>{asset.risk_score}/100</Badge>
              </Group>
            </Group>

            <Divider />

            <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
              <Paper p="md" radius="lg" withBorder>
                <Text fw={700} mb="md">
                  Identity
                </Text>
                <Stack gap="sm">
                  <Group justify="space-between" align="flex-start">
                    <Text size="sm" c="dimmed">
                      Value
                    </Text>
                    <Code>{asset.value}</Code>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                      Created
                    </Text>
                    <Text>{formatDateTime(asset.created_at)}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                      Updated
                    </Text>
                    <Text>{formatDateTime(asset.updated_at)}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                      Last scan
                    </Text>
                    <Text>{formatDateTime(asset.last_scanned_at)}</Text>
                  </Group>
                </Stack>
              </Paper>

              <Paper p="md" radius="lg" withBorder>
                <Text fw={700} mb="md">
                  Tags and baseline risk
                </Text>
                <Stack gap="sm">
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                      Initial risk
                    </Text>
                    <Badge color={getRiskColor(asset.risk_score)}>{asset.risk_score}/100</Badge>
                  </Group>
                  <div>
                    <Text size="sm" c="dimmed" mb={8}>
                      Tags
                    </Text>
                    <Group gap="xs">
                      {asset.tags.length > 0 ? (
                        asset.tags.map((tag) => (
                          <Badge key={tag.id} variant="dot">
                            {tag.name}
                          </Badge>
                        ))
                      ) : (
                        <Text c="dimmed" size="sm">
                          No tags assigned yet.
                        </Text>
                      )}
                    </Group>
                  </div>
                </Stack>
              </Paper>
            </SimpleGrid>
          </Stack>
        ) : null}
      </Paper>

      {asset ? (
        <>
          {renderRiskHistory()}

          {asset.asset_type === 'ip'
            ? renderIpIntelligence()
            : asset.asset_type === 'github_repo'
            ? renderGitHubIntelligence()
            : renderAutomationPlaceholder()}
        </>
      ) : null}
    </DashboardPageLayout>
  );
};
