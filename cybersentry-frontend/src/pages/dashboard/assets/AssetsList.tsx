import { Alert, Box, Button, Paper, Text } from '@mantine/core';
import { IconPlus, IconServer2 } from '@tabler/icons-react';
import AssetDeleteModal from '../../../components/assets/AssetDeleteModal';
import AssetFormModal from '../../../components/assets/AssetFormModal';
import AssetsFilters from '../../../components/assets/AssetsFilters';
import AssetsMobileList from '../../../components/assets/AssetsMobileList';
import AssetsTable from '../../../components/assets/AssetsTable';
import { useAssets } from '../../../hooks/assets/useAssets';
import DashboardPageLayout, { DashboardStatCards } from '../../../layouts/dashboard/DashboardPageLayout';

export const AssetsList = () => {
  const {
    summary,
    metrics,
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

  return (
    <>
      <DashboardPageLayout
        icon={<IconServer2 size={26} />}
        eyebrow="Assets"
        title="Managed assets and attack surface inventory"
        description="Add, classify, and maintain the attack surface inventory, then open each asset as the central entry point for linked IP and GitHub intelligence."
        metrics={metrics}
        actions={
          <Button leftSection={<IconPlus size={16} />} onClick={() => openCreateModal()}>
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
          <Box visibleFrom="md">
            <AssetsTable assets={filteredAssets} onEdit={openEditModal} onDelete={requestDeleteAsset} />
          </Box>

          <Box hiddenFrom="md">
            <AssetsMobileList assets={filteredAssets} onEdit={openEditModal} onDelete={requestDeleteAsset} />
          </Box>

          {isLoading ? (
            <Text c="dimmed" mt="md">
              Loading assets...
            </Text>
          ) : null}
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
