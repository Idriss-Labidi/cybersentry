import { Alert, Box, Button, Paper, Text } from '@mantine/core';
import { IconPlus, IconTicket } from '@tabler/icons-react';
import IncidentDeleteModal from '../../../components/incidents/IncidentDeleteModal';
import IncidentFormModal from '../../../components/incidents/IncidentFormModal';
import IncidentsFilters from '../../../components/incidents/IncidentsFilters';
import IncidentsTable from '../../../components/incidents/IncidentsTable';
import { useIncidents } from '../../../hooks/incidents/useIncidents';
import DashboardPageLayout from '../../../layouts/dashboard/DashboardPageLayout';

export const IncidentsList = () => {
  const {
    incidents,
    filteredIncidents,
    isLoading,
    isSubmitting,
    isDeleting,
    error,
    searchTerm,
    statusFilter,
    priorityFilter,
    slaFilter,
    setSearchTerm,
    setStatusFilter,
    setPriorityFilter,
    setSlaFilter,
    form,
    formErrors,
    modalOpened,
    editingIncidentId,
    deleteModalIncident,
    setDeleteModalIncident,
    updateForm,
    openCreateModal,
    openEditModal,
    closeEditorModal,
    handleSubmit,
    requestDeleteIncident,
    confirmDeleteIncident,
  } = useIncidents();

  return (
    <>
      <DashboardPageLayout
        icon={<IconTicket size={26} />}
        eyebrow="Incidents"
        title="Incident tickets and SLA tracking"
        description="Create and manage incident tickets manually today, with a model that already supports automated incident ingestion in future phases."
        actions={
          <Button leftSection={<IconPlus size={16} />} onClick={() => openCreateModal()}>
            Create ticket
          </Button>
        }
      >
        {error ? (
          <Alert color="red" variant="light" title="Incident operation failed">
            {error}
          </Alert>
        ) : null}

        <IncidentsFilters
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          priorityFilter={priorityFilter}
          slaFilter={slaFilter}
          filteredCount={filteredIncidents.length}
          totalCount={incidents.length}
          onSearchChange={setSearchTerm}
          onStatusFilterChange={setStatusFilter}
          onPriorityFilterChange={setPriorityFilter}
          onSlaFilterChange={setSlaFilter}
        />

        <Paper p="lg" radius="xl" pos="relative">
          <Box>
            <IncidentsTable
              incidents={filteredIncidents}
              onEdit={openEditModal}
              onDelete={requestDeleteIncident}
            />
          </Box>

          {isLoading ? (
            <Text c="dimmed" mt="md">
              Loading incident tickets...
            </Text>
          ) : null}
        </Paper>
      </DashboardPageLayout>

      <IncidentFormModal
        opened={modalOpened}
        editingIncidentId={editingIncidentId}
        form={form}
        formErrors={formErrors}
        isSubmitting={isSubmitting}
        onClose={closeEditorModal}
        onSubmit={() => void handleSubmit()}
        onUpdateForm={updateForm}
      />

      <IncidentDeleteModal
        incident={deleteModalIncident}
        isDeleting={isDeleting}
        onClose={() => setDeleteModalIncident(null)}
        onConfirm={() => void confirmDeleteIncident()}
      />
    </>
  );
};

