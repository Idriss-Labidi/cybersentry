import { useEffect, useMemo, useState } from 'react';
import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Code,
  Divider,
  Group,
  LoadingOverlay,
  Modal,
  NumberInput,
  Paper,
  ScrollArea,
  Select,
  SimpleGrid,
  Stack,
  Table,
  TagsInput,
  Text,
  TextInput,
  Textarea,
  ThemeIcon,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
  IconAlertTriangle,
  IconEdit,
  IconPlus,
  IconSearch,
  IconServer2,
  IconShieldCheck,
  IconTrash,
  IconTrashX,
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

const assetTypeMeta: Record<
  AssetType,
  {
    namePlaceholder: string;
    valuePlaceholder: string;
    valueDescription: string;
  }
> = {
  domain: {
    namePlaceholder: 'Primary domain',
    valuePlaceholder: 'example.com',
    valueDescription: 'Use the root domain you want to monitor for DNS drift and ownership changes.',
  },
  ip: {
    namePlaceholder: 'Public gateway IP',
    valuePlaceholder: '8.8.8.8',
    valueDescription: 'Use a public IPv4 or IPv6 address associated with your infrastructure.',
  },
  website: {
    namePlaceholder: 'Customer portal',
    valuePlaceholder: 'https://app.example.com',
    valueDescription: 'Use the full HTTP or HTTPS URL that should be monitored for content changes.',
  },
  github_repo: {
    namePlaceholder: 'Frontend repository',
    valuePlaceholder: 'https://github.com/owner/repository',
    valueDescription: 'Use the full GitHub repository URL for repository health checks and history.',
  },
};

type AssetFormState = {
  name: string;
  asset_type: AssetType;
  value: string;
  category: AssetCategory;
  status: AssetStatus;
  description: string;
  risk_score: number;
  tags: string[];
};

type AssetFormErrors = Partial<Record<'name' | 'value' | 'risk_score', string>>;

const defaultFormState: AssetFormState = {
  name: '',
  asset_type: 'domain',
  value: '',
  category: 'production',
  status: 'active',
  description: '',
  risk_score: 0,
  tags: [],
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
  risk_score: Math.max(0, Math.min(100, Math.round(form.risk_score))),
  tag_names: form.tags.map((tag) => tag.trim()).filter(Boolean),
});

const validateAssetValue = (assetType: AssetType, value: string) => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return 'Asset value is required.';
  }

  if (assetType === 'domain') {
    const domainPattern =
      /^(?=.{1,253}$)(?!-)(?:[a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,63}$/;
    return domainPattern.test(trimmedValue) ? null : 'Use a valid domain like example.com.';
  }

  if (assetType === 'ip') {
    const ipv4Pattern =
      /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
    const isIpv6 = trimmedValue.includes(':');
    return ipv4Pattern.test(trimmedValue) || isIpv6
      ? null
      : 'Use a valid IPv4 or IPv6 address.';
  }

  if (assetType === 'website') {
    try {
      const url = new URL(trimmedValue);
      return ['http:', 'https:'].includes(url.protocol)
        ? null
        : 'Use a valid HTTP or HTTPS URL.';
    } catch {
      return 'Use a valid website URL like https://app.example.com.';
    }
  }

  const githubPattern = /^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/i;
  return githubPattern.test(trimmedValue)
    ? null
    : 'Use a full GitHub repository URL like https://github.com/owner/repository.';
};

const validateForm = (form: AssetFormState): AssetFormErrors => {
  const errors: AssetFormErrors = {};

  if (!form.name.trim()) {
    errors.name = 'Asset name is required.';
  }

  const valueError = validateAssetValue(form.asset_type, form.value);
  if (valueError) {
    errors.value = valueError;
  }

  if (form.risk_score < 0 || form.risk_score > 100) {
    errors.risk_score = 'Risk score must stay between 0 and 100.';
  }

  return errors;
};

export const Assets = () => {
  const isMobile = useMediaQuery('(max-width: 48em)');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [summary, setSummary] = useState<AssetSummaryResponse>(emptySummary);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpened, setModalOpened] = useState(false);
  const [deleteModalAsset, setDeleteModalAsset] = useState<Asset | null>(null);
  const [editingAssetId, setEditingAssetId] = useState<number | null>(null);
  const [form, setForm] = useState<AssetFormState>(defaultFormState);
  const [formErrors, setFormErrors] = useState<AssetFormErrors>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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

  const filteredAssets = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return assets.filter((asset) => {
      const matchesSearch =
        !normalizedSearch ||
        asset.name.toLowerCase().includes(normalizedSearch) ||
        asset.value.toLowerCase().includes(normalizedSearch) ||
        asset.description.toLowerCase().includes(normalizedSearch) ||
        asset.tags.some((tag) => tag.name.toLowerCase().includes(normalizedSearch));

      const matchesType = typeFilter === 'all' || asset.asset_type === typeFilter;
      const matchesCategory = categoryFilter === 'all' || asset.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;

      return matchesSearch && matchesType && matchesCategory && matchesStatus;
    });
  }, [assets, categoryFilter, searchTerm, statusFilter, typeFilter]);

  const updateForm = <K extends keyof AssetFormState>(field: K, value: AssetFormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (field === 'name' || field === 'value' || field === 'risk_score') {
      setFormErrors((current) => ({ ...current, [field]: undefined }));
    }
  };

  const closeEditorModal = () => {
    setModalOpened(false);
    setFormErrors({});
  };

  const openCreateModal = () => {
    setEditingAssetId(null);
    setForm(defaultFormState);
    setFormErrors({});
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
      tags: asset.tags.map((tag) => tag.name),
    });
    setFormErrors({});
    setModalOpened(true);
  };

  const handleSubmit = async () => {
    const errors = validateForm(form);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    const payload = buildPayload(form);
    setIsSubmitting(true);
    setError(null);

    try {
      if (editingAssetId) {
        await updateAsset(editingAssetId, payload);
      } else {
        await createAsset(payload);
      }

      closeEditorModal();
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

  const requestDeleteAsset = (asset: Asset) => {
    setDeleteModalAsset(asset);
  };

  const confirmDeleteAsset = async () => {
    if (!deleteModalAsset) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await deleteAsset(deleteModalAsset.id);
      setDeleteModalAsset(null);
      await loadAssets();
    } catch (deleteError: unknown) {
      setError(getApiErrorMessage(deleteError, [], 'Failed to delete asset.'));
    } finally {
      setIsDeleting(false);
    }
  };

  const assetTypeConfig = assetTypeMeta[form.asset_type];

  return (
    <>
      <DashboardPageLayout
        icon={<IconServer2 size={26} />}
        eyebrow="Assets"
        title="Managed assets and attack surface inventory"
        description="Add, classify, and maintain the attack surface inventory with controls that are clearer on both desktop and mobile."
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
              <IconShieldCheck size={20} />
              <Text fw={800}>Input guidance</Text>
            </Group>
            <Text c="dimmed">
              The asset modal now adapts placeholders and validation rules to the selected asset type, so domain,
              IP, website, and GitHub entries no longer share the same generic input hints.
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

        <Paper p="lg" radius="xl">
          <Stack gap="lg">
            <Group justify="space-between" align="flex-start">
              <div>
                <Text fw={800}>Asset inventory</Text>
                <Text size="sm" c="dimmed" mt={4}>
                  Search, filter, and act on assets without losing context on smaller screens.
                </Text>
              </div>
              <Badge variant="light">{filteredAssets.length} shown</Badge>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, xl: 4 }} spacing="md">
              <TextInput
                label="Search"
                placeholder="Search by name, value, description, or tag"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.currentTarget.value)}
                leftSection={<IconSearch size={16} />}
              />
              <Select
                label="Type"
                value={typeFilter}
                onChange={(value) => setTypeFilter(value ?? 'all')}
                allowDeselect={false}
                data={[
                  { value: 'all', label: 'All types' },
                  ...assetTypeOptions.map((option) => ({ value: option.value, label: option.label })),
                ]}
              />
              <Select
                label="Category"
                value={categoryFilter}
                onChange={(value) => setCategoryFilter(value ?? 'all')}
                allowDeselect={false}
                data={[
                  { value: 'all', label: 'All categories' },
                  ...categoryOptions.map((option) => ({ value: option.value, label: option.label })),
                ]}
              />
              <Select
                label="Status"
                value={statusFilter}
                onChange={(value) => setStatusFilter(value ?? 'all')}
                allowDeselect={false}
                data={[
                  { value: 'all', label: 'All statuses' },
                  ...statusOptions.map((option) => ({ value: option.value, label: option.label })),
                ]}
              />
            </SimpleGrid>
          </Stack>
        </Paper>

        <Paper p="lg" radius="xl" pos="relative">
          <LoadingOverlay visible={isLoading} />

          <Box visibleFrom="md">
            <ScrollArea>
              <Table striped highlightOnHover withTableBorder>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Asset</Table.Th>
                    <Table.Th>Identifier</Table.Th>
                    <Table.Th>Classification</Table.Th>
                    <Table.Th>Risk & status</Table.Th>
                    <Table.Th>Last scan</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredAssets.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={6}>
                        <Text c="dimmed">
                          No assets match the current filters. Try broadening the search or adding a new asset.
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    filteredAssets.map((asset) => (
                      <Table.Tr key={asset.id}>
                        <Table.Td>
                          <Stack gap={4}>
                            <Text fw={700}>{asset.name}</Text>
                            <Text size="sm" c="dimmed" lineClamp={2}>
                              {asset.description || 'No description provided yet.'}
                            </Text>
                          </Stack>
                        </Table.Td>
                        <Table.Td>
                          <Stack gap={8}>
                            <Badge variant="light">{asset.asset_type_label}</Badge>
                            <Code>{asset.value}</Code>
                          </Stack>
                        </Table.Td>
                        <Table.Td>
                          <Stack gap={8}>
                            <Badge variant="light" color={getCategoryColor(asset.category)}>
                              {asset.category_label}
                            </Badge>
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
                          </Stack>
                        </Table.Td>
                        <Table.Td>
                          <Stack gap={8}>
                            <Badge color={getRiskColor(asset.risk_score)}>{asset.risk_score}/100</Badge>
                            <Badge color={getStatusColor(asset.status)} variant="light">
                              {asset.status_label}
                            </Badge>
                          </Stack>
                        </Table.Td>
                        <Table.Td>{formatDateTime(asset.last_scanned_at)}</Table.Td>
                        <Table.Td>
                          <Group gap="xs" wrap="nowrap">
                            <ActionIcon
                              variant="light"
                              onClick={() => openEditModal(asset)}
                              aria-label={`Edit ${asset.name}`}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                            <ActionIcon
                              variant="light"
                              color="red"
                              onClick={() => requestDeleteAsset(asset)}
                              aria-label={`Delete ${asset.name}`}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))
                  )}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </Box>

          <Box hiddenFrom="md">
            <Stack gap="md">
              {filteredAssets.length === 0 ? (
                <Paper p="lg" radius="lg" withBorder>
                  <Text c="dimmed">
                    No assets match the current filters. Try broadening the search or adding a new asset.
                  </Text>
                </Paper>
              ) : (
                filteredAssets.map((asset) => (
                  <Paper key={asset.id} p="lg" radius="lg" withBorder>
                    <Stack gap="md">
                      <Group justify="space-between" align="flex-start">
                        <div>
                          <Text fw={800}>{asset.name}</Text>
                          <Text size="sm" c="dimmed" mt={4}>
                            {asset.description || 'No description provided yet.'}
                          </Text>
                        </div>
                        <Group gap="xs">
                          <ActionIcon
                            variant="light"
                            onClick={() => openEditModal(asset)}
                            aria-label={`Edit ${asset.name}`}
                          >
                            <IconEdit size={16} />
                          </ActionIcon>
                          <ActionIcon
                            variant="light"
                            color="red"
                            onClick={() => requestDeleteAsset(asset)}
                            aria-label={`Delete ${asset.name}`}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Group>
                      </Group>

                      <Code block>{asset.value}</Code>

                      <SimpleGrid cols={2} spacing="sm">
                        <div>
                          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                            Type
                          </Text>
                          <Badge mt={6} variant="light">
                            {asset.asset_type_label}
                          </Badge>
                        </div>
                        <div>
                          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                            Category
                          </Text>
                          <Badge mt={6} variant="light" color={getCategoryColor(asset.category)}>
                            {asset.category_label}
                          </Badge>
                        </div>
                        <div>
                          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                            Risk
                          </Text>
                          <Badge mt={6} color={getRiskColor(asset.risk_score)}>
                            {asset.risk_score}/100
                          </Badge>
                        </div>
                        <div>
                          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                            Status
                          </Text>
                          <Badge mt={6} variant="light" color={getStatusColor(asset.status)}>
                            {asset.status_label}
                          </Badge>
                        </div>
                      </SimpleGrid>

                      <div>
                        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                          Tags
                        </Text>
                        <Group gap={6} mt={8}>
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
                      </div>

                      <Divider />

                      <Text size="sm" c="dimmed">
                        Last scan: {formatDateTime(asset.last_scanned_at)}
                      </Text>
                    </Stack>
                  </Paper>
                ))
              )}
            </Stack>
          </Box>
        </Paper>
      </DashboardPageLayout>

      <Modal
        opened={modalOpened}
        onClose={closeEditorModal}
        title={editingAssetId ? 'Edit asset' : 'Add asset'}
        size="lg"
        fullScreen={!!isMobile}
      >
        <Stack gap="lg">
          <Alert variant="light" color="blue" title="Input guidance">
            {assetTypeConfig.valueDescription}
          </Alert>

          <TextInput
            label="Asset name"
            placeholder={assetTypeConfig.namePlaceholder}
            value={form.name}
            error={formErrors.name}
            onChange={(event) => updateForm('name', event.currentTarget.value)}
            required
          />

          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <Select
              label="Asset type"
              data={assetTypeOptions}
              value={form.asset_type}
              onChange={(value) => updateForm('asset_type', (value as AssetType | null) ?? form.asset_type)}
              allowDeselect={false}
            />
            <Select
              label="Category"
              data={categoryOptions}
              value={form.category}
              onChange={(value) => updateForm('category', (value as AssetCategory | null) ?? form.category)}
              allowDeselect={false}
            />
          </SimpleGrid>

          <TextInput
            label="Asset value"
            placeholder={assetTypeConfig.valuePlaceholder}
            description={assetTypeConfig.valueDescription}
            value={form.value}
            error={formErrors.value}
            onChange={(event) => updateForm('value', event.currentTarget.value)}
            required
            spellCheck={false}
          />

          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <Select
              label="Status"
              data={statusOptions}
              value={form.status}
              onChange={(value) => updateForm('status', (value as AssetStatus | null) ?? form.status)}
              allowDeselect={false}
            />
            <NumberInput
              label="Risk score"
              description="0 is low risk, 100 is critical."
              min={0}
              max={100}
              clampBehavior="strict"
              value={form.risk_score}
              error={formErrors.risk_score}
              onChange={(value) => updateForm('risk_score', typeof value === 'number' ? value : 0)}
            />
          </SimpleGrid>

          <TagsInput
            label="Tags"
            placeholder="Press Enter after each tag"
            value={form.tags}
            onChange={(value) => updateForm('tags', value)}
            description="Use short labels like critical, external, customer-facing, or internal."
          />

          <Textarea
            label="Description"
            minRows={4}
            placeholder="Add operational context, ownership notes, or why this asset matters."
            value={form.description}
            onChange={(event) => updateForm('description', event.currentTarget.value)}
          />

          <Group justify="flex-end">
            <Button variant="default" onClick={closeEditorModal}>
              Cancel
            </Button>
            <Button onClick={() => void handleSubmit()} loading={isSubmitting}>
              {editingAssetId ? 'Save changes' : 'Create asset'}
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={!!deleteModalAsset}
        onClose={() => setDeleteModalAsset(null)}
        title="Delete asset"
        size="md"
        centered
      >
        <Stack gap="lg">
          <Group gap="sm" align="flex-start">
            <ThemeIcon color="red" variant="light" size={44} radius="xl">
              <IconTrashX size={22} />
            </ThemeIcon>
            <div>
              <Text fw={800}>This action cannot be undone.</Text>
              <Text size="sm" c="dimmed" mt={4}>
                The asset will be removed from the inventory and any future dashboard workflows built on top of it.
              </Text>
            </div>
          </Group>

          {deleteModalAsset ? (
            <Paper p="md" radius="lg" withBorder>
              <Stack gap="sm">
                <Group justify="space-between">
                  <Text c="dimmed" size="sm">
                    Asset
                  </Text>
                  <Text fw={700}>{deleteModalAsset.name}</Text>
                </Group>
                <Group justify="space-between">
                  <Text c="dimmed" size="sm">
                    Type
                  </Text>
                  <Badge variant="light">{deleteModalAsset.asset_type_label}</Badge>
                </Group>
                <Group justify="space-between" align="flex-start">
                  <Text c="dimmed" size="sm">
                    Value
                  </Text>
                  <Code>{deleteModalAsset.value}</Code>
                </Group>
                <Group justify="space-between">
                  <Text c="dimmed" size="sm">
                    Risk
                  </Text>
                  <Badge color={getRiskColor(deleteModalAsset.risk_score)}>
                    {deleteModalAsset.risk_score}/100
                  </Badge>
                </Group>
              </Stack>
            </Paper>
          ) : null}

          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeleteModalAsset(null)}>
              Cancel
            </Button>
            <Button color="red" onClick={() => void confirmDeleteAsset()} loading={isDeleting}>
              Delete asset
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
};