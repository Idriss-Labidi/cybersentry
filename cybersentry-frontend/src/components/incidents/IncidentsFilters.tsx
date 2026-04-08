import { Badge, Group, Paper, Select, SimpleGrid, TextInput } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import {
  priorityOptions,
  statusOptions,
} from '../../utils/incidents/incidentForm';
import type {
  IncidentPriority,
  IncidentSlaState,
  IncidentStatus,
} from '../../services/incidents';

type IncidentsFiltersProps = {
  searchTerm: string;
  statusFilter: IncidentStatus | 'all';
  priorityFilter: IncidentPriority | 'all';
  slaFilter: IncidentSlaState | 'all';
  filteredCount: number;
  totalCount: number;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: IncidentStatus | 'all') => void;
  onPriorityFilterChange: (value: IncidentPriority | 'all') => void;
  onSlaFilterChange: (value: IncidentSlaState | 'all') => void;
};

const statusData = [{ value: 'all', label: 'All statuses' }, ...statusOptions];
const priorityData = [{ value: 'all', label: 'All priorities' }, ...priorityOptions];
const slaData = [
  { value: 'all', label: 'All SLA states' },
  { value: 'on_track', label: 'On track' },
  { value: 'at_risk', label: 'At risk' },
  { value: 'breached', label: 'Breached' },
  { value: 'not_applicable', label: 'Not applicable' },
];

export default function IncidentsFilters({
  searchTerm,
  statusFilter,
  priorityFilter,
  slaFilter,
  filteredCount,
  totalCount,
  onSearchChange,
  onStatusFilterChange,
  onPriorityFilterChange,
  onSlaFilterChange,
}: IncidentsFiltersProps) {
  return (
    <Paper p="lg" radius="xl">
      <SimpleGrid cols={{ base: 1, md: 2, xl: 4 }}>
        <TextInput
          label="Search"
          placeholder="Title, category, description, asset"
          leftSection={<IconSearch size={16} />}
          value={searchTerm}
          onChange={(event) => onSearchChange(event.currentTarget.value)}
        />

        <Select
          label="Status"
          data={statusData}
          value={statusFilter}
          onChange={(value) => onStatusFilterChange((value as IncidentStatus | 'all' | null) ?? 'all')}
          allowDeselect={false}
        />

        <Select
          label="Priority"
          data={priorityData}
          value={priorityFilter}
          onChange={(value) =>
            onPriorityFilterChange((value as IncidentPriority | 'all' | null) ?? 'all')
          }
          allowDeselect={false}
        />

        <Select
          label="SLA"
          data={slaData}
          value={slaFilter}
          onChange={(value) => onSlaFilterChange((value as IncidentSlaState | 'all' | null) ?? 'all')}
          allowDeselect={false}
        />
      </SimpleGrid>

      <Group mt="md">
        <Badge variant="light">{filteredCount} visible</Badge>
        <Badge variant="dot" color="gray">
          {totalCount} total
        </Badge>
      </Group>
    </Paper>
  );
}

