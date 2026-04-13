import { Alert, Box, Button, Paper, Text, SegmentedControl, Group, Stack } from '@mantine/core';
import { IconPlus, IconTicket, IconList, IconLayoutKanban } from '@tabler/icons-react';
import { useState } from 'react';
import IncidentDeleteModal from '../../../components/incidents/IncidentDeleteModal';
import IncidentFormModal from '../../../components/incidents/IncidentFormModal';
import IncidentsFilters from '../../../components/incidents/IncidentsFilters';
import IncidentsTable from '../../../components/incidents/IncidentsTable';
import IncidentsListView from '../../../components/incidents/IncidentsListView';
import IncidentsKanbanBoard from '../../../components/incidents/IncidentsKanbanBoard';
import { useIncidents } from '../../../hooks/incidents/useIncidents';
import DashboardPageLayout from '../../../layouts/dashboard/DashboardPageLayout';

export const IncidentsList = () => {
  const [viewMode, setViewMode] = useState<'table' | 'list' | 'kanban'>('list');
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
    filterByCurrentUser,
    setSearchTerm,
    setStatusFilter,
    setPriorityFilter,
    setSlaFilter,
    setFilterByCurrentUser,
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

        <Paper p="lg" radius="xl">
          <Stack gap="md">
            {/* View Toggle */}
            <Group justify="space-between" align="center">
              <Group>
                <Text size="sm" fw={500}>View:</Text>
                <SegmentedControl
                  value={viewMode}
                  onChange={(value) => setViewMode(value as 'table' | 'list' | 'kanban')}
                  data={[
                    { label: 'Table', value: 'table', leftSection: <IconList size={14} /> },
                    { label: 'List', value: 'list', leftSection: <IconTicket size={14} /> },
                    { label: 'Board', value: 'kanban', leftSection: <IconLayoutKanban size={14} /> },
                  ]}
                />
              </Group>

              {/* Filter Toggle */}
              <Group>
                <Text size="sm" fw={500}>Filter:</Text>
                <SegmentedControl
                  value={filterByCurrentUser ? 'user' : 'all'}
                  onChange={(value) => setFilterByCurrentUser(value === 'user')}
                  data={[
                    { label: 'My Tickets', value: 'user' },
                    { label: 'All Tickets', value: 'all' },
                  ]}
                />
              </Group>
            </Group>

            {/* View Content */}
            <Box>
              {viewMode === 'table' && (
                <IncidentsTable
                  incidents={filteredIncidents}
                  onEdit={openEditModal}
                  onDelete={requestDeleteIncident}
                />
              )}
              {viewMode === 'list' && (
                <IncidentsListView
                  incidents={filteredIncidents}
                  onEdit={openEditModal}
                  onDelete={requestDeleteIncident}
                />
              )}
              {viewMode === 'kanban' && (
                <IncidentsKanbanBoard
                  incidents={filteredIncidents}
                  onCardClick={openEditModal}
                />
              )}
            </Box>

            {isLoading ? (
              <Text c="dimmed" mt="md">
                Loading incident tickets...
              </Text>
            ) : null}
          </Stack>
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

