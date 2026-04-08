import { useEffect, useMemo } from 'react';
import { Alert, Badge, Button, Group, Paper, SimpleGrid, Stack, Text } from '@mantine/core';
import { IconArrowLeft, IconCircleCheck, IconPlayerPause, IconRefresh, IconTicket } from '@tabler/icons-react';
import { Link, useParams } from 'react-router-dom';
import { useIncidentDetail } from '../../../hooks/incidents/useIncidentDetail';
import { useDashboardBreadcrumb } from '../../../layouts/dashboard/DashboardBreadcrumbContext';
import DashboardPageLayout from '../../../layouts/dashboard/DashboardPageLayout';
import { formatDateTime, getIncidentPriorityColor, getIncidentStatusColor, getSlaStateColor } from '../../../utils/incidents/incidentForm';

export const IncidentDetail = () => {
  const { id } = useParams();
  const incidentId = Number(id);
  const { setCurrentLabel } = useDashboardBreadcrumb();
  const { incident, isLoading, isUpdatingStatus, error, loadIncident, handleCloseIncident, handleReopenIncident } =
    useIncidentDetail(incidentId);

  useEffect(() => {
    setCurrentLabel(incident?.title ?? null);
    return () => {
      setCurrentLabel(null);
    };
  }, [incident?.title, setCurrentLabel]);

  const metrics = useMemo(() => {
    if (!incident) {
      return [];
    }

    return [
      { label: 'Status', value: incident.status_label, hint: `Last status change: ${formatDateTime(incident.last_status_change_at)}` },
      { label: 'Priority', value: incident.priority_label, hint: `Severity: ${incident.severity_label}` },
      { label: 'SLA state', value: incident.sla_state.replace('_', ' '), hint: `Due at: ${formatDateTime(incident.due_at)}` },
    ];
  }, [incident]);

  return (
    <DashboardPageLayout
      icon={<IconTicket size={26} />}
      eyebrow="Incidents"
      title={incident?.title ?? 'Incident detail'}
      description={
        incident
          ? 'Detailed operational context and lifecycle tracking for this incident ticket.'
          : 'Loading incident detail.'
      }
      metrics={metrics}
      actions={
        <Group gap="sm">
          <Button variant="default" component={Link} to="/dashboard/incidents" leftSection={<IconArrowLeft size={16} />}>
            Back to incidents
          </Button>
          <Button variant="light" onClick={() => void loadIncident()} leftSection={<IconRefresh size={16} />}>
            Refresh
          </Button>
          {incident?.status !== 'closed' ? (
            <Button color="green" loading={isUpdatingStatus} onClick={() => void handleCloseIncident()} leftSection={<IconCircleCheck size={16} />}>
              Close ticket
            </Button>
          ) : (
            <Button color="yellow" loading={isUpdatingStatus} onClick={() => void handleReopenIncident()} leftSection={<IconPlayerPause size={16} />}>
              Reopen ticket
            </Button>
          )}
        </Group>
      }
    >
      {error ? (
        <Alert color="red" variant="light" title="Incident detail unavailable">
          {error}
        </Alert>
      ) : null}

      {incident ? (
        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
          <Paper p="lg" radius="xl">
            <Stack gap="sm">
              <Group gap={8}>
                <Badge color={getIncidentStatusColor(incident.status)} variant="light">
                  {incident.status_label}
                </Badge>
                <Badge color={getIncidentPriorityColor(incident.priority)}>{incident.priority_label}</Badge>
                <Badge color={getSlaStateColor(incident.sla_state)} variant="light">
                  {incident.sla_state.replace('_', ' ')}
                </Badge>
              </Group>
              <Text fw={700}>Description</Text>
              <Text c="dimmed">{incident.description || 'No description provided.'}</Text>
              <Text size="sm">Type: {incident.incident_type || 'N/A'}</Text>
              <Text size="sm">Category: {incident.category || 'N/A'}</Text>
              <Text size="sm">Subcategory: {incident.subcategory || 'N/A'}</Text>
              <Text size="sm">Affected asset: {incident.affected_asset || 'N/A'}</Text>
              <Text size="sm">Environment: {incident.environment || 'N/A'}</Text>
              <Text size="sm">Reporter email: {incident.reporter_email || 'N/A'}</Text>
            </Stack>
          </Paper>

          <Paper p="lg" radius="xl">
            <Stack gap="sm">
              <Text fw={700}>Timeline and resolution</Text>
              <Text size="sm">Reported at: {formatDateTime(incident.reported_at)}</Text>
              <Text size="sm">Detected at: {formatDateTime(incident.detected_at)}</Text>
              <Text size="sm">Acknowledged at: {formatDateTime(incident.acknowledged_at)}</Text>
              <Text size="sm">Due at: {formatDateTime(incident.due_at)}</Text>
              <Text size="sm">Resolved at: {formatDateTime(incident.resolved_at)}</Text>
              <Text size="sm">Closed at: {formatDateTime(incident.closed_at)}</Text>
              <Text fw={700} mt="sm">
                Customer impact
              </Text>
              <Text c="dimmed">{incident.customer_impact || 'No customer impact notes.'}</Text>
              <Text fw={700}>Mitigation</Text>
              <Text c="dimmed">{incident.mitigation || 'No mitigation notes.'}</Text>
              <Text fw={700}>Root cause</Text>
              <Text c="dimmed">{incident.root_cause || 'No root cause documented.'}</Text>
              <Text fw={700}>Resolution summary</Text>
              <Text c="dimmed">{incident.resolution_summary || 'No resolution summary documented.'}</Text>
            </Stack>
          </Paper>
        </SimpleGrid>
      ) : null}

      {isLoading ? <Text c="dimmed">Loading incident details...</Text> : null}
    </DashboardPageLayout>
  );
};

