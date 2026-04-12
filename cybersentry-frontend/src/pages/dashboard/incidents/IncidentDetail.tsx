import { useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Divider,
  Group,
  Modal,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  ThemeIcon,
  Timeline,
  Loader,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconCircleCheck,
  IconPlayerPause,
  IconRefresh,
  IconTicket,
  IconAlertTriangle,
  IconMessage,
  IconSend,
  IconUser,
} from '@tabler/icons-react';
import { Link, useParams } from 'react-router-dom';
import { useIncidentDetail } from '../../../hooks/incidents/useIncidentDetail';
import { useDashboardBreadcrumb } from '../../../layouts/dashboard/DashboardBreadcrumbContext';
import DashboardPageLayout from '../../../layouts/dashboard/DashboardPageLayout';
import { formatDateTime, getIncidentPriorityColor, getIncidentStatusColor, getSlaStateColor } from '../../../utils/incidents/incidentForm';
import { addComment, assignTicket, getOrganizationUsers } from '../../../services/incidents';

export const IncidentDetail = () => {
  const { id } = useParams();
  const incidentId = Number(id);
  const { setCurrentLabel } = useDashboardBreadcrumb();
  const { incident, isLoading, isUpdatingStatus, error, loadIncident, handleCloseIncident, handleReopenIncident } =
    useIncidentDetail(incidentId);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<Array<{ value: string; label: string }>>([]);
  const [loadingTeamMembers, setLoadingTeamMembers] = useState(false);
  const [teamMembersError, setTeamMembersError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  // Load team members when assignment modal opens
  useEffect(() => {
    if (!assignModalOpen) return;

    const loadTeamMembers = async () => {
      setLoadingTeamMembers(true);
      setTeamMembersError(null);
      try {
        const response = await getOrganizationUsers();
        console.log('Organization users response:', response.data);
        
        // Map users to dropdown options
        const members = response.data.map((user) => ({
          value: String(user.id),
          label: `${user.full_name || user.email}${user.role ? ` (${user.role})` : ''}`,
        }));
        
        console.log('Mapped team members:', members);
        setTeamMembers(members);
        
        if (members.length === 0) {
          setTeamMembersError('No active users found in your organization.');
        }
      } catch (err) {
        console.error('Failed to load team members:', err);
        setTeamMembersError('Failed to load team members. Please try again.');
      } finally {
        setLoadingTeamMembers(false);
      }
    };

    loadTeamMembers();
  }, [assignModalOpen]);

  useEffect(() => {
    setCurrentLabel(incident?.title ?? null);
    return () => {
      setCurrentLabel(null);
    };
  }, [incident?.title, setCurrentLabel]);

  const handleAssignTicket = async () => {
    if (!selectedAssignee) return;

    setIsAssigning(true);
    try {
      await assignTicket(incidentId, parseInt(selectedAssignee, 10));
      await loadIncident();
      setAssignModalOpen(false);
      setSelectedAssignee(null);
    } catch (err) {
      console.error('Failed to assign ticket:', err);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    setIsSubmittingComment(true);
    setCommentError(null);
    try {
      await addComment(incidentId, { content: commentText });
      setCommentText('');
      await loadIncident();
    } catch (err) {
      setCommentError('Failed to add comment. Please try again.');
      console.error('Failed to add comment:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardPageLayout
        icon={<IconTicket size={26} />}
        eyebrow="Incidents"
        title="Loading..."
        description="Loading incident details..."
      >
        <Text c="dimmed">Loading incident details...</Text>
      </DashboardPageLayout>
    );
  }

  if (!incident) {
    return (
      <DashboardPageLayout
        icon={<IconTicket size={26} />}
        eyebrow="Incidents"
        title="Incident not found"
        description="The incident you're looking for doesn't exist."
      >
        <Button component={Link} to="/dashboard/incidents" leftSection={<IconArrowLeft size={16} />}>
          Back to incidents
        </Button>
      </DashboardPageLayout>
    );
  }

  return (
    <DashboardPageLayout
      icon={<IconTicket size={26} />}
      eyebrow="Incidents"
      title={incident.title}
      description={`Ticket #${incident.id} • Created on ${formatDateTime(incident.created_at)}`}
      actions={
        <Group gap="sm">
          <Button variant="default" component={Link} to="/dashboard/incidents" leftSection={<IconArrowLeft size={16} />}>
            Back
          </Button>
          <Button variant="light" onClick={() => void loadIncident()} leftSection={<IconRefresh size={16} />}>
            Refresh
          </Button>
          {incident.status !== 'closed' ? (
            <Button
              color="green"
              loading={isUpdatingStatus}
              onClick={() => void handleCloseIncident()}
              leftSection={<IconCircleCheck size={16} />}
            >
              Close ticket
            </Button>
          ) : (
            <Button
              color="yellow"
              loading={isUpdatingStatus}
              onClick={() => void handleReopenIncident()}
              leftSection={<IconPlayerPause size={16} />}
            >
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

      <Stack gap="lg">
        {/* HEADER WITH STATUS & BADGES */}
        <Paper p="lg" radius="xl" withBorder>
          <Group justify="space-between" mb="md">
            <Group gap="md">
              <Badge color={getIncidentStatusColor(incident.status)} size="lg" variant="light">
                {incident.status_label}
              </Badge>
              <Badge color={getIncidentPriorityColor(incident.priority)} size="lg">
                {incident.priority_label}
              </Badge>
              <Badge color={getSlaStateColor(incident.sla_state)} size="lg" variant="light">
                {incident.sla_state.replace('_', ' ')}
              </Badge>
            </Group>
            <Button variant="light" onClick={() => setAssignModalOpen(true)} leftSection={<IconUser size={16} />}>
              {incident.assigned_to ? `Assigned to ${incident.assigned_to.full_name}` : 'Assign ticket'}
            </Button>
          </Group>

          <Divider my="md" />

          {/* QUICK INFO */}
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb="md">
            <div>
              <Text size="xs" c="dimmed" fw={500}>
                PRIORITY
              </Text>
              <Text fw={600}>{incident.priority_label}</Text>
            </div>
            <div>
              <Text size="xs" c="dimmed" fw={500}>
                SEVERITY
              </Text>
              <Text fw={600}>{incident.severity_label}</Text>
            </div>
            <div>
              <Text size="xs" c="dimmed" fw={500}>
                IMPACT
              </Text>
              <Text fw={600}>{incident.impact_label}</Text>
            </div>
            <div>
              <Text size="xs" c="dimmed" fw={500}>
                DUE DATE
              </Text>
              <Text fw={600}>{formatDateTime(incident.due_at)}</Text>
            </div>
          </SimpleGrid>
        </Paper>

        <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="lg">
          {/* MAIN CONTENT (LEFT) */}
          <Stack gap="lg" style={{ gridColumn: '1 / span 2' }}>
            {/* DESCRIPTION */}
            <Paper p="lg" radius="xl" withBorder>
              <Group mb="md">
                <ThemeIcon variant="light" size="lg" radius="md">
                  <IconMessage size={20} />
                </ThemeIcon>
                <Text fw={600}>Description</Text>
              </Group>
              <Text c="dimmed">{incident.description || 'No description provided'}</Text>
            </Paper>

            {/* DETAILS */}
            <Paper p="lg" radius="xl" withBorder>
              <Text fw={600} mb="md">
                Incident Details
              </Text>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Type:
                  </Text>
                  <Text size="sm">{incident.incident_type || 'N/A'}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Category:
                  </Text>
                  <Text size="sm">{incident.category || 'N/A'}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Subcategory:
                  </Text>
                  <Text size="sm">{incident.subcategory || 'N/A'}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Affected Asset:
                  </Text>
                  <Text size="sm">{incident.affected_asset || 'N/A'}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Environment:
                  </Text>
                  <Text size="sm">{incident.environment || 'N/A'}</Text>
                </Group>
              </Stack>
            </Paper>

            {/* IMPACT SECTIONS */}
            {incident.customer_impact && (
              <Paper p="lg" radius="xl" withBorder bg="orange.0">
                <Group mb="md">
                  <ThemeIcon variant="light" size="lg" radius="md" color="orange">
                    <IconAlertTriangle size={20} />
                  </ThemeIcon>
                  <Text fw={600}>Customer Impact</Text>
                </Group>
                <Text c="dimmed">{incident.customer_impact}</Text>
              </Paper>
            )}

            {incident.mitigation && (
              <Paper p="lg" radius="xl" withBorder>
                <Text fw={600} mb="md">
                  Mitigation Steps
                </Text>
                <Text c="dimmed">{incident.mitigation}</Text>
              </Paper>
            )}

            {incident.root_cause && (
              <Paper p="lg" radius="xl" withBorder>
                <Text fw={600} mb="md">
                  Root Cause
                </Text>
                <Text c="dimmed">{incident.root_cause}</Text>
              </Paper>
            )}

            {incident.resolution_summary && (
              <Paper p="lg" radius="xl" withBorder bg="green.0">
                <Text fw={600} mb="md">
                  Resolution Summary
                </Text>
                <Text c="dimmed">{incident.resolution_summary}</Text>
              </Paper>
            )}

            {/* COMMENTS SECTION */}
            <Paper p="lg" radius="xl" withBorder>
              <Group mb="md">
                <ThemeIcon variant="light" size="lg" radius="md" color="blue">
                  <IconMessage size={20} />
                </ThemeIcon>
                <Text fw={600}>Comments</Text>
              </Group>

              {/* COMMENT FORM */}
              <Stack gap="sm" mb="lg">
                <Textarea
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.currentTarget.value)}
                  minRows={2}
                  error={commentError}
                />
                <Group justify="flex-end">
                  <Button
                    onClick={handleAddComment}
                    loading={isSubmittingComment}
                    disabled={!commentText.trim()}
                    leftSection={<IconSend size={16} />}
                  >
                    Add Comment
                  </Button>
                </Group>
              </Stack>

              <Divider my="md" />

              {/* COMMENTS LIST */}
              <Stack gap="md">
                {incident.comments && incident.comments.length > 0 ? (
                  incident.comments.map((comment) => (
                    <Paper key={comment.id} p="md" radius="md">
                      <Group justify="space-between" mb="xs">
                        <Group gap="sm">
                          <Avatar name={comment.author.full_name} size="sm" />
                          <div>
                            <Text fw={600} size="sm">
                              {comment.author.full_name || comment.author.email}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {formatDateTime(comment.created_at)}
                            </Text>
                          </div>
                        </Group>
                      </Group>
                      <Text size="sm">{comment.content}</Text>
                    </Paper>
                  ))
                ) : (
                  <Text size="sm" c="dimmed">
                    No comments yet. Be the first to add one!
                  </Text>
                )}
              </Stack>
            </Paper>
          </Stack>

          {/* SIDEBAR (RIGHT) */}
          <Stack gap="lg">
            {/* TIMELINE */}
            <Paper p="lg" radius="xl" withBorder>
              <Text fw={600} mb="md">
                Timeline
              </Text>
              <Timeline active={-1} bulletSize={24} lineWidth={2}>
                <Timeline.Item bullet={<IconTicket size={12} />} title="Created">
                  <Text c="dimmed" size="sm">
                    {formatDateTime(incident.created_at)}
                  </Text>
                </Timeline.Item>

                {incident.detected_at && (
                  <Timeline.Item bullet={<IconAlertTriangle size={12} />} title="Detected">
                    <Text c="dimmed" size="sm">
                      {formatDateTime(incident.detected_at)}
                    </Text>
                  </Timeline.Item>
                )}

                {incident.acknowledged_at && (
                  <Timeline.Item bullet={<IconCircleCheck size={12} />} title="Acknowledged">
                    <Text c="dimmed" size="sm">
                      {formatDateTime(incident.acknowledged_at)}
                    </Text>
                  </Timeline.Item>
                )}

                {incident.resolved_at && (
                  <Timeline.Item bullet={<IconCircleCheck size={12} />} title="Resolved">
                    <Text c="dimmed" size="sm">
                      {formatDateTime(incident.resolved_at)}
                    </Text>
                  </Timeline.Item>
                )}

                {incident.closed_at && (
                  <Timeline.Item bullet={<IconCircleCheck size={12} />} title="Closed">
                    <Text c="dimmed" size="sm">
                      {formatDateTime(incident.closed_at)}
                    </Text>
                  </Timeline.Item>
                )}
              </Timeline>
            </Paper>

            {/* PEOPLE */}
            <Paper p="lg" radius="xl" withBorder>
              <Text fw={600} mb="md">
                People
              </Text>
              <Stack gap="md">
                {incident.created_by && (
                  <Group gap="sm">
                    <Avatar name={incident.created_by.full_name} size="sm" />
                    <div>
                      <Text size="sm" fw={500}>
                        Creator
                      </Text>
                      <Text size="xs" c="dimmed">
                        {incident.created_by.full_name || incident.created_by.email}
                      </Text>
                    </div>
                  </Group>
                )}

                {incident.assigned_to && (
                  <Group gap="sm">
                    <Avatar name={incident.assigned_to.full_name} size="sm" color="blue" />
                    <div>
                      <Text size="sm" fw={500}>
                        Assigned to
                      </Text>
                      <Text size="xs" c="dimmed">
                        {incident.assigned_to.full_name || incident.assigned_to.email}
                      </Text>
                    </div>
                  </Group>
                )}

                {incident.reporter_email && (
                  <Group gap="sm">
                    <Avatar name={incident.reporter_email} size="sm" color="gray" />
                    <div>
                      <Text size="sm" fw={500}>
                        Reporter
                      </Text>
                      <Text size="xs" c="dimmed">
                        {incident.reporter_email}
                      </Text>
                    </div>
                  </Group>
                )}
              </Stack>
            </Paper>

            {/* SLA INFO */}
            <Paper p="lg" radius="xl" withBorder>
              <Text fw={600} mb="md">
                SLA Information
              </Text>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Policy:
                  </Text>
                  <Badge>{incident.sla_policy_label}</Badge>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    State:
                  </Text>
                  <Badge color={getSlaStateColor(incident.sla_state)}>
                    {incident.sla_state.replace('_', ' ')}
                  </Badge>
                </Group>
                {incident.due_at && (
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                      Due:
                    </Text>
                    <Text size="sm">{formatDateTime(incident.due_at)}</Text>
                  </Group>
                )}
              </Stack>
            </Paper>
          </Stack>
        </SimpleGrid>
      </Stack>

      {/* ASSIGNMENT MODAL */}
      <Modal opened={assignModalOpen} onClose={() => setAssignModalOpen(false)} title="Assign Ticket">
        <Stack>
          {loadingTeamMembers ? (
            <Group justify="center" py="lg">
              <Loader size="sm" />
              <Text size="sm" c="dimmed">Loading team members...</Text>
            </Group>
          ) : teamMembersError ? (
            <Alert color="yellow" variant="light">
              {teamMembersError}
            </Alert>
          ) : teamMembers.length === 0 ? (
            <Alert color="blue" variant="light">
              No team members available to assign.
            </Alert>
          ) : (
            <>
              <Select
                label="Assign to"
                placeholder="Select a team member"
                data={teamMembers}
                value={selectedAssignee}
                onChange={setSelectedAssignee}
                searchable
                clearable
                maxDropdownHeight={300}
              />
              <Group justify="flex-end">
                <Button variant="default" onClick={() => setAssignModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAssignTicket} loading={isAssigning} disabled={!selectedAssignee}>
                  Assign
                </Button>
              </Group>
            </>
          )}
        </Stack>
      </Modal>
    </DashboardPageLayout>
  );
};

