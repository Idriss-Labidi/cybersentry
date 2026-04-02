import { ActionIcon, Badge, Group, ScrollArea, Stack, Table, Text } from '@mantine/core';
import { IconEdit, IconEye, IconTrash } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import type { IncidentTicket } from '../../services/incidents';
import {
  formatDateTime,
  getIncidentPriorityColor,
  getIncidentStatusColor,
  getSlaStateColor,
} from '../../utils/incidents/incidentForm';

type IncidentsTableProps = {
  incidents: IncidentTicket[];
  onEdit: (incident: IncidentTicket) => void;
  onDelete: (incident: IncidentTicket) => void;
};

export default function IncidentsTable({ incidents, onEdit, onDelete }: IncidentsTableProps) {
  return (
    <ScrollArea>
      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Ticket</Table.Th>
            <Table.Th>Classification</Table.Th>
            <Table.Th>SLA</Table.Th>
            <Table.Th style={{ textAlign: 'center' }}>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {incidents.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={4}>
                <Text c="dimmed">No incidents match the current filters.</Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            incidents.map((incident) => (
              <Table.Tr key={incident.id}>
                <Table.Td>
                  <Stack gap={3}>
                    <Text fw={700}>{incident.title}</Text>
                    <Text size="sm" c="dimmed">
                      {incident.short_code || `INC-${incident.id}`}
                    </Text>
                    <Text size="xs" c="dimmed">
                      Reported: {formatDateTime(incident.reported_at)}
                    </Text>
                  </Stack>
                </Table.Td>
                <Table.Td>
                  <Group gap={6}>
                    <Badge color={getIncidentStatusColor(incident.status)} variant="light">
                      {incident.status_label}
                    </Badge>
                    <Badge color={getIncidentPriorityColor(incident.priority)}>{incident.priority_label}</Badge>
                    <Badge variant="outline">{incident.severity_label}</Badge>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Stack gap={4}>
                    <Badge color={getSlaStateColor(incident.sla_state)} variant="light">
                      {incident.sla_state.replace('_', ' ')}
                    </Badge>
                    <Text size="xs" c="dimmed">
                      Due: {formatDateTime(incident.due_at)}
                    </Text>
                  </Stack>
                </Table.Td>
                <Table.Td style={{ textAlign: 'center' }}>
                  <Group gap="xs" wrap="nowrap" justify="center">
                    <ActionIcon
                      component={Link}
                      to={`/dashboard/incidents/${incident.id}`}
                      variant="light"
                      aria-label={`View ${incident.title}`}
                    >
                      <IconEye size={16} />
                    </ActionIcon>
                    <ActionIcon variant="light" onClick={() => onEdit(incident)} aria-label={`Edit ${incident.title}`}>
                      <IconEdit size={16} />
                    </ActionIcon>
                    <ActionIcon
                      variant="light"
                      color="red"
                      onClick={() => onDelete(incident)}
                      aria-label={`Delete ${incident.title}`}
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
  );
}

