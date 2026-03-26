import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Group,
  LoadingOverlay,
  Modal,
  NumberInput,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  Textarea,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconDeviceDesktopAnalytics,
  IconEdit,
  IconPlus,
  IconServer2,
  IconTrash,
} from '@tabler/icons-react';
import DashboardPageLayout, { DashboardStatCards } from '../../layouts/dashboard/DashboardPageLayout';
import {
  createAsset,
  deleteAsset,
  getAssets,
  getAssetSummary,
  updateAsset,
  type Asset,
  type AssetCategory,
  type AssetPayload,
  type AssetStatus,
  type AssetSummaryResponse,
  type AssetType,
} from '../../services/assets';
import { getApiErrorMessage } from '../../utils/api-error';

const assetTypeOptions = [
  { value: 'domain', label: 'Domain' },
  { value: 'ip', label: 'IP' },
  { value: 'website', label: 'Website' },
  { value: 'github_repo', label: 'GitHub Repository' },
] as const;

const categoryOptions = [
  { value: 'production', label: 'Production' },
  { value: 'development', label: 'Development' },
  { value: 'test', label: 'Test' },
] as const;

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'archived', label: 'Archived' },
] as const;

type AssetFormState = {
  name: string;
  asset_type: AssetType;
  value: string;
  category: AssetCategory;
  status: AssetStatus;
  description: string;
  risk_score: number;
  tagInput: string;
};

const defaultFormState: AssetFormState = {
  name: '',
  asset_type: 'domain',
  value: '',
  category: 'production',
  status: 'active',
  description: '',
  risk_score: 0,
  tagInput: '',
};

const emptySummary: AssetSummaryResponse = {
  total_assets: 0,
  high_risk_assets: 0,
  average_risk_score: 0,
  by_category: {
    production: 0,
    development: 0,
    test: 0,
  },
  by_type: {
    domain: 0,
    ip: 0,
    website: 0,
    github_repo: 0,
  },
};

const getRiskColor = (score: number) => {
  if (score >= 70) {
    return 'red';
  }

  if (score >= 40) {
    return 'yellow';
  }

  return 'green';
};

const formatDateTime = (value: string | null) => {
  if (!value) {
    return 'Not scanned yet';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not scanned yet' : date.toLocaleString();
};

const buildPayload = (form: AssetFormState): AssetPayload => ({
  name: form.name.trim(),
  asset_type: form.asset_type,
  value: form.value.trim(),
  category: form.category,
  status: form.status,
  description: form.description.trim(),
  risk_score: form.risk_score,
  tag_names: form.tagInput
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean),
});

export const Assets = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [summary, setSummary] = useState<AssetSummaryResponse>(emptySummary);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpened, setModalOpened] = useState(false);
  const [editingAssetId, setEditingAssetId] = useState<number | null>(null);
  const [form, setForm] = useState<AssetFormState>(defaultFormState);

  const loadAssets = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [assetsResponse, summaryResponse] = await Promise.all([getAssets(), getAssetSummary()]);
      setAssets(assetsResponse.data);
      setSummary(summaryResponse.data);
    } catch (loadError: unknown) {
      setError(getApiErrorMessage(loadError, [], 'Failed to load assets.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAssets();
  }, []);

  const metrics = useMemo(
    () => [
      {
        label: 'Managed assets',
        value: String(summary.total_assets),
        hint: 'All authenticated assets in the current organization',
      },
      {
        label: 'High risk',
        value: String(summary.high_risk_assets),
        hint: 'Assets currently scored at 70/100 or above',
      },
      {
        label: 'Average risk',
        value: `${summary.average_risk_score}/100`,
        hint: 'Average score across tracked assets',
      },
    ],
    [summary]
  );

  const updateForm = <K extends keyof AssetFormState>(field: K, value: AssetFormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const openCreateModal = () => {
    setEditingAssetId(null);
    setForm(defaultFormState);
    setModalOpened(true);
  };

  const openEditModal = (asset: Asset) => {
    setEditingAssetId(asset.id);
    setForm({
      name: asset.name,
      asset_type: asset.asset_type,
      value: asset.value,
      category: asset.category,
      status: asset.status,
      description: asset.description,
      risk_score: asset.risk_score,
      tagInput: asset.tags.map((tag) => tag.name).join(', '),
    });
    setModalOpened(true);
  };

  const handleSubmit = async () => {
    const payload = buildPayload(form);
    if (!payload.name || !payload.value) {
      setError('Name and asset value are required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (editingAssetId) {
        await updateAsset(editingAssetId, payload);
      } else {
        await createAsset(payload);
      }

      setModalOpened(false);
      setForm(defaultFormState);
      await loadAssets();
    } catch (submitError: unknown) {
      setError(
        getApiErrorMessage(
          submitError,
          ['name', 'value', 'risk_score', 'organization', 'non_field_errors'],
          'Failed to save asset.'
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (asset: Asset) => {
    const shouldDelete = window.confirm(`Delete asset "${asset.name}"?`);
    if (!shouldDelete) {
      return;
    }

    setError(null);

    try {
      await deleteAsset(asset.id);
      await loadAssets();
    } catch (deleteError: unknown) {
      setError(getApiErrorMessage(deleteError, [], 'Failed to delete asset.'));
    }
  };

  return (
    <>
      <DashboardPageLayout
        icon={<IconServer2 size={26} />}
        eyebrow="Assets"
        title="Managed assets and attack surface inventory"
        description="Add, modify, and remove authenticated assets while keeping categories, tags, and an initial risk baseline in one dashboard surface."
        metrics={metrics}
        actions={
          <Button leftSection={<IconPlus size={16} />} onClick={openCreateModal}>
            Add asset
          </Button>
        }
      >
        {error ? (
          <Alert color="red" variant="light" title="Asset operation failed">
            {error}
          </Alert>
        ) : null}

        <DashboardStatCards
          items={[
            { label: 'Domains', value: String(summary.by_type.domain), hint: 'DNS attack surface under watch' },
            { label: 'IPs', value: String(summary.by_type.ip), hint: 'Infrastructure addresses tracked' },
            { label: 'Websites', value: String(summary.by_type.website), hint: 'Web properties monitored' },
            {
              label: 'GitHub repos',
              value: String(summary.by_type.github_repo),
              hint: 'Repositories tied to authenticated workflows',
            },
          ]}
        />

        <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="lg">
          <Paper p="lg" radius="xl">
            <Text fw={800} mb="md">
              Environment mix
            </Text>
            <Stack gap="sm">
              <Group justify="space-between">
                <Text>Production</Text>
                <Badge color="red" variant="light">
                  {summary.by_category.production}
                </Badge>
              </Group>
              <Group justify="space-between">
                <Text>Development</Text>
                <Badge color="blue" variant="light">
                  {summary.by_category.development}
                </Badge>
              </Group>
              <Group justify="space-between">
                <Text>Test</Text>
                <Badge color="gray" variant="light">
                  {summary.by_category.test}
                </Badge>
              </Group>
            </Stack>
          </Paper>

          <Paper p="lg" radius="xl">
            <Group gap="sm" mb="md">
              <IconDeviceDesktopAnalytics size={20} />
              <Text fw={800}>Foundation status</Text>
            </Group>
            <Text c="dimmed">
              This branch lays down the asset inventory layer that future scans, alerts, ticketing, and reporting will use.
            </Text>
          </Paper>

          <Paper p="lg" radius="xl">
            <Group gap="sm" mb="md">
              <IconAlertTriangle size={20} />
              <Text fw={800}>Next automation targets</Text>
            </Group>
            <Stack gap="xs">
              <Text c="dimmed">DNS record change monitoring</Text>
              <Text c="dimmed">Website defacement detection</Text>
              <Text c="dimmed">Scheduled risk snapshot generation</Text>
            </Stack>
          </Paper>
        </SimpleGrid>

        <Paper p="lg" radius="xl" pos="relative">
          <LoadingOverlay visible={isLoading} />

          <Group justify="space-between" mb="md">
            <Text fw={800}>Asset inventory</Text>
            <Badge variant="light">{assets.length} tracked</Badge>
          </Group>

          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Value</Table.Th>
                <Table.Th>Category</Table.Th>
                <Table.Th>Tags</Table.Th>
                <Table.Th>Risk</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Last scan</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {assets.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={9}>
                    <Text c="dimmed">No assets yet. Start by adding your first domain, IP, website, or repository.</Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                assets.map((asset) => (
                  <Table.Tr key={asset.id}>
                    <Table.Td>
                      <Stack gap={2}>
                        <Text fw={700}>{asset.name}</Text>
                        {asset.description ? (
                          <Text size="sm" c="dimmed" lineClamp={2}>
                            {asset.description}
                          </Text>
                        ) : null}
                      </Stack>
                    </Table.Td>
                    <Table.Td>{asset.asset_type_label}</Table.Td>
                    <Table.Td>{asset.value}</Table.Td>
                    <Table.Td>
                      <Badge variant="light">{asset.category_label}</Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={6}>
                        {asset.tags.length === 0 ? (
                          <Text size="sm" c="dimmed">
                            No tags
                          </Text>
                        ) : (
                          asset.tags.map((tag) => (
                            <Badge key={tag.id} variant="dot">
                              {tag.name}
                            </Badge>
                          ))
                        )}
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={getRiskColor(asset.risk_score)}>{asset.risk_score}/100</Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={asset.status === 'active' ? 'green' : asset.status === 'paused' ? 'yellow' : 'gray'}>
                        {asset.status_label}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{formatDateTime(asset.last_scanned_at)}</Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Button
                          size="xs"
                          variant="light"
                          onClick={() => openEditModal(asset)}
                        >
                          <IconEdit size={14} />
                        </Button>
                        <Button
                          size="xs"
                          variant="light"
                          color="red"
                          onClick={() => void handleDelete(asset)}
                        >
                          <IconTrash size={14} />
                        </Button>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Paper>
      </DashboardPageLayout>

      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title={editingAssetId ? 'Edit asset' : 'Add asset'}
        size="lg"
      >
        <Stack>
          <TextInput
            label="Asset name"
            placeholder="Main Website"
            value={form.name}
            onChange={(event) => {
              const value = event.currentTarget.value;
              updateForm('name', value);
            }}
            required
          />

          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <Select
              label="Asset type"
              data={assetTypeOptions}
              value={form.asset_type}
              onChange={(value) =>
                updateForm('asset_type', (value as AssetType | null) ?? form.asset_type)
              }
              allowDeselect={false}
            />
            <Select
              label="Category"
              data={categoryOptions}
              value={form.category}
              onChange={(value) =>
                updateForm('category', (value as AssetCategory | null) ?? form.category)
              }
              allowDeselect={false}
            />
          </SimpleGrid>

          <TextInput
            label="Asset value"
            placeholder="https://app.example.com or 8.8.8.8"
            value={form.value}
            onChange={(event) => {
              const value = event.currentTarget.value;
              updateForm('value', value);
            }}
            required
          />

          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <Select
              label="Status"
              data={statusOptions}
              value={form.status}
              onChange={(value) =>
                updateForm('status', (value as AssetStatus | null) ?? form.status)
              }
              allowDeselect={false}
            />
            <NumberInput
              label="Risk score"
              min={0}
              max={100}
              value={form.risk_score}
              onChange={(value) =>
                updateForm('risk_score', typeof value === 'number' ? value : 0)
              }
            />
          </SimpleGrid>

          <TextInput
            label="Tags"
            placeholder="critical, customer-facing, external"
            value={form.tagInput}
            onChange={(event) => {
              const value = event.currentTarget.value;
              updateForm('tagInput', value);
            }}
            description="Comma-separated tags"
          />

          <Textarea
            label="Description"
            minRows={3}
            placeholder="Optional context for operators and future scanners"
            value={form.description}
            onChange={(event) => {
              const value = event.currentTarget.value;
              updateForm('description', value);
            }}
          />

          <Group justify="flex-end">
            <Button variant="default" onClick={() => setModalOpened(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleSubmit()} loading={isSubmitting}>
              {editingAssetId ? 'Save changes' : 'Create asset'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
};
