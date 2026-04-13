import { Badge, Card, Flex, Group, Paper, ScrollArea, Stack, Text } from '@mantine/core';
import type { IncidentTicket, IncidentStatus } from '../../services/incidents';
import {
  getIncidentPriorityColor,
} from '../../utils/incidents/incidentForm';
import styles from './IncidentsKanbanBoard.module.css';

type IncidentsKanbanBoardProps = {
  incidents: IncidentTicket[];
  onCardClick?: (incident: IncidentTicket) => void;
};

const STATUS_COLUMNS: Array<{ status: IncidentStatus; label: string }> = [
  { status: 'new', label: 'New' },
  { status: 'triaged', label: 'Triaged' },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'on_hold', label: 'On Hold' },
  { status: 'resolved', label: 'Resolved' },
  { status: 'closed', label: 'Closed' },
];

export default function IncidentsKanbanBoard({
  incidents,
  onCardClick,
}: IncidentsKanbanBoardProps) {
  const getIncidentsForStatus = (status: IncidentStatus) => {
    return incidents.filter((inc) => inc.status === status);
  };

  const KanbanCard = ({ incident }: { incident: IncidentTicket }) => (
    <Card
      p="sm"
      radius="md"
      className={styles.kanbanCard}
      onClick={() => onCardClick?.(incident)}
    >
      <Stack gap="xs">
        <Group justify="space-between" gap="xs">
          <Text fw={600} size="sm" lineClamp={2}>
            {incident.title}
          </Text>
          <Badge size="xs" variant="light" color={getIncidentPriorityColor(incident.priority)}>
            {incident.priority_label}
          </Badge>
        </Group>

        <Text size="xs" c="dimmed">
          {incident.short_code || `INC-${incident.id}`}
        </Text>

        {incident.assigned_to && (
          <Text size="xs" c="blue">
            👤 {incident.assigned_to.full_name}
          </Text>
        )}

        <Group gap={4}>
          {incident.tags && incident.tags.length > 0 && (
            <>
              {incident.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} size="xs" variant="outline">
                  {tag}
                </Badge>
              ))}
              {incident.tags.length > 2 && (
                <Badge size="xs" variant="outline">
                  +{incident.tags.length - 2}
                </Badge>
              )}
            </>
          )}
        </Group>
      </Stack>
    </Card>
  );

  return (
    <ScrollArea>
      <Flex gap="md" className={styles.kanbanBoard}>
        {STATUS_COLUMNS.map(({ status, label }) => {
          const columnIncidents = getIncidentsForStatus(status);
          return (
            <Paper
              key={status}
              p="md"
              radius="lg"
              className={styles.kanbanColumn}
              withBorder
            >
              <Stack gap="md">
                {/* Column Header */}
                <Group justify="space-between">
                  <Text fw={600} size="sm">
                    {label}
                  </Text>
                  <Badge size="xs" variant="light">
                    {columnIncidents.length}
                  </Badge>
                </Group>

                {/* Divider */}
                <div className={styles.divider} />

                {/* Cards Container */}
                <Stack gap="sm" className={styles.cardsContainer}>
                  {columnIncidents.length === 0 ? (
                    <Text size="xs" c="dimmed" ta="center" py="md">
                      No tickets
                    </Text>
                  ) : (
                    columnIncidents.map((incident) => (
                      <KanbanCard key={incident.id} incident={incident} />
                    ))
                  )}
                </Stack>
              </Stack>
            </Paper>
          );
        })}
      </Flex>
    </ScrollArea>
  );
}




