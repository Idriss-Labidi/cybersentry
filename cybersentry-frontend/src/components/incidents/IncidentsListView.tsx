import { Avatar, Badge, Flex, Group, Paper, Stack, Text, ActionIcon } from '@mantine/core';
import { IconEdit, IconEye, IconTrash } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import type { IncidentTicket } from '../../services/incidents';
import {
  formatDateTime,
  getIncidentPriorityColor,
  getIncidentStatusColor,
  getSlaStateColor,
} from '../../utils/incidents/incidentForm';
import styles from './IncidentsListView.module.css';

type IncidentsListViewProps = {
  incidents: IncidentTicket[];
  onEdit: (incident: IncidentTicket) => void;
  onDelete: (incident: IncidentTicket) => void;
};

export default function IncidentsListView({ incidents, onEdit, onDelete }: IncidentsListViewProps) {
  if (incidents.length === 0) {
    return (
      <Paper p="lg" radius="xl" ta="center">
        <Text c="dimmed">No incidents match the current filters.</Text>
      </Paper>
    );
  }

  return (
    <Stack gap="sm">
      {incidents.map((incident) => (
        <Paper
          key={incident.id}
          p="md"
          radius="lg"
          className={styles.incidentRow}
          withBorder
        >
          <Flex justify="space-between" align="flex-start" gap="md" wrap="wrap">
            {/* Left: Title and Info */}
            <Stack gap="xs" style={{ flex: 1, minWidth: 300 }}>
              <Group gap="xs">
                <Text fw={600} size="sm" component={Link} to={`/dashboard/incidents/${incident.id}`} className={styles.titleLink}>
                  {incident.title}
                </Text>
                <Badge size="xs" variant="light" color="gray">
                  {incident.short_code || `INC-${incident.id}`}
                </Badge>
              </Group>

              <Group gap={6}>
                <Badge
                  size="xs"
                  color={getIncidentStatusColor(incident.status)}
                  variant="light"
                >
                  {incident.status_label}
                </Badge>
                <Badge
                  size="xs"
                  color={getIncidentPriorityColor(incident.priority)}
                >
                  {incident.priority_label}
                </Badge>
                <Badge size="xs" variant="outline">
                  {incident.severity_label}
                </Badge>
              </Group>

              <Group gap="sm" mt={4}>
                {incident.created_by && (
                  <Group gap={4}>
                    <Text size="xs" c="dimmed">By:</Text>
                    <Group gap={4}>
                      <Avatar size={20} name={incident.created_by.full_name} radius="xl" />
                      <Text size="xs">{incident.created_by.full_name}</Text>
                    </Group>
                  </Group>
                )}
                {incident.assigned_to && (
                  <Group gap={4}>
                    <Text size="xs" c="dimmed">Assigned:</Text>
                    <Group gap={4}>
                      <Avatar size={20} name={incident.assigned_to.full_name} radius="xl" />
                      <Text size="xs">{incident.assigned_to.full_name}</Text>
                    </Group>
                  </Group>
                )}
              </Group>
            </Stack>

            {/* Middle: SLA and Due Date */}
            <Stack gap="xs" align="flex-start" style={{ minWidth: 180 }}>
              <Badge
                size="xs"
                color={getSlaStateColor(incident.sla_state)}
                variant="light"
              >
                SLA: {incident.sla_state.replace('_', ' ')}
              </Badge>
              <Text size="xs" c="dimmed">
                Due: {formatDateTime(incident.due_at)}
              </Text>
              <Text size="xs" c="dimmed">
                Reported: {formatDateTime(incident.reported_at)}
              </Text>
            </Stack>

            {/* Right: Actions */}
            <Group gap="xs">
              <ActionIcon
                component={Link}
                to={`/dashboard/incidents/${incident.id}`}
                variant="light"
                aria-label={`View ${incident.title}`}
              >
                <IconEye size={16} />
              </ActionIcon>
              <ActionIcon
                variant="light"
                onClick={() => onEdit(incident)}
                aria-label={`Edit ${incident.title}`}
              >
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
          </Flex>
        </Paper>
      ))}
    </Stack>
  );
}


