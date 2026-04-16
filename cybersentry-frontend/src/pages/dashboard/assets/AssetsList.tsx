import { useEffect, useState } from 'react';
import { Alert, Button, Paper, Stack, Text } from '@mantine/core';
import { IconLayoutKanban, IconList, IconPlus, IconServer2 } from '@tabler/icons-react';
import AssetsBoardView from '../../../components/assets/AssetsBoardView';
import AssetDeleteModal from '../../../components/assets/AssetDeleteModal';
import AssetFormModal from '../../../components/assets/AssetFormModal';
import AssetsFilters from '../../../components/assets/AssetsFilters';
import AssetsMobileList from '../../../components/assets/AssetsMobileList';
import AssetsTable from '../../../components/assets/AssetsTable';
import { DashboardViewModeToggle } from '../../../components/dashboard/DashboardViewModeToggle';
import type { GuidanceItem } from '../../../components/guidance/GuidanceHoverCard';
import { useAssets } from '../../../hooks/assets/useAssets';
import DashboardPageLayout, { DashboardStatCards } from '../../../layouts/dashboard/DashboardPageLayout';
import { getProfileInfo } from '../../../services/profile';

type UserRole = 'admin' | 'analyst' | 'viewer';

export const AssetsList = () => {
  const [viewMode, setViewMode] = useState<'table' | 'list' | 'board'>('table');
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const guidanceItems: GuidanceItem[] = [
    {
      label: 'What this page does',
      title: 'Asset inventory overview',
      description:
        'This page is the central inventory for domains, IPs, websites, and GitHub repositories managed by the authenticated user.',
      bullets: [
        'Create and classify assets by type, category, and status.',
        'Use the asset detail page as the entry point for linked intelligence.',
      ],
      badge: 'Assets',
    },
    {
      label: 'How to use it',
      title: 'Working with the inventory',
      description:
        'Use the list as a navigation and triage layer rather than a place to read every technical detail.',
      bullets: [
        'Filter and search first, then open the asset detail for deeper analysis.',
        'The baseline risk is the current working score for the asset until broader automated scoring is added.',
      ],
    },
  ];

  useEffect(() => {
    let isActive = true;

    const loadRole = async () => {
      try {
        const response = await getProfileInfo();

        if (isActive) {
          setUserRole(response.data.role.toLowerCase() as UserRole);
        }
      } catch {
        if (isActive) {
          setUserRole('viewer');
        }
      }
    };

    void loadRole();

    return () => {
      isActive = false;
    };
  }, []);

  const {
    summary,
    filteredAssets,
    isLoading,
    isSubmitting,
    isDeleting,
    error,
    modalOpened,
    deleteModalAsset,
    editingAssetId,
    form,
    formErrors,
    assetTypeConfig,
    searchTerm,
    typeFilter,
    categoryFilter,
    statusFilter,
    setSearchTerm,
    setTypeFilter,
    setCategoryFilter,
    setStatusFilter,
    updateForm,
    openCreateModal,
    openEditModal,
    closeEditorModal,
    handleSubmit,
    requestDeleteAsset,
    confirmDeleteAsset,
    setDeleteModalAsset,
  } = useAssets();
  const canCreateAssets = userRole === 'admin';

  return (
    <>
      <DashboardPageLayout
        icon={<IconServer2 size={26} />}
        eyebrow="Assets"
        title="Managed assets and attack surface inventory"
        description="Add, classify, and maintain the attack surface inventory, then open each asset as the central entry point for linked IP and GitHub intelligence."
        guidance={guidanceItems}
        actions={
          canCreateAssets ? (
            <Button leftSection={<IconPlus size={16} />} onClick={() => openCreateModal()}>
              Add asset
            </Button>
          ) : null
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

        <AssetsFilters
          filteredCount={filteredAssets.length}
          totalCount={summary.total_assets}
          productionCount={summary.by_category.production}
          developmentCount={summary.by_category.development}
          testCount={summary.by_category.test}
          searchTerm={searchTerm}
          typeFilter={typeFilter}
          categoryFilter={categoryFilter}
          statusFilter={statusFilter}
          onSearchChange={setSearchTerm}
          onTypeFilterChange={setTypeFilter}
          onCategoryFilterChange={setCategoryFilter}
          onStatusFilterChange={setStatusFilter}
        />

        <Paper p="lg" radius="xl" pos="relative">
          <Stack gap="md">
            <DashboardViewModeToggle
              value={viewMode}
              onChange={(value) => setViewMode(value as 'table' | 'list' | 'board')}
              options={[
                { label: 'Table', value: 'table', leftSection: <IconList size={14} /> },
                { label: 'List', value: 'list', leftSection: <IconServer2 size={14} /> },
                { label: 'Board', value: 'board', leftSection: <IconLayoutKanban size={14} /> },
              ]}
            />

            {viewMode === 'table' ? (
              <AssetsTable assets={filteredAssets} onEdit={openEditModal} onDelete={requestDeleteAsset} />
            ) : null}
            {viewMode === 'list' ? (
              <AssetsMobileList assets={filteredAssets} onEdit={openEditModal} onDelete={requestDeleteAsset} />
            ) : null}
            {viewMode === 'board' ? (
              <AssetsBoardView assets={filteredAssets} onEdit={openEditModal} onDelete={requestDeleteAsset} />
            ) : null}

            {isLoading ? (
              <Text c="dimmed">Loading assets...</Text>
            ) : null}
          </Stack>
        </Paper>
      </DashboardPageLayout>

      <AssetFormModal
        opened={modalOpened}
        editingAssetId={editingAssetId}
        form={form}
        formErrors={formErrors}
        assetTypeConfig={assetTypeConfig}
        isSubmitting={isSubmitting}
        onClose={closeEditorModal}
        onSubmit={() => void handleSubmit()}
        onUpdateForm={updateForm}
      />

      <AssetDeleteModal
        asset={deleteModalAsset}
        isDeleting={isDeleting}
        onClose={() => setDeleteModalAsset(null)}
        onConfirm={() => void confirmDeleteAsset()}
      />
    </>
  );
};
