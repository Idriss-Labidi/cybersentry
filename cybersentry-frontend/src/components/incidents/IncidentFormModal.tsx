import {
  Button,
  Divider,
  Group,
  Modal,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  TagsInput,
  Text,
  TextInput,
  Textarea,
  ThemeIcon,
  Badge,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
  IconAlertCircle,
  IconClock,
  IconFileText,
  IconTag,
  IconAlertTriangle,
  IconListCheck,
} from '@tabler/icons-react';
import {
  impactOptions,
  priorityOptions,
  severityOptions,
  slaOptions,
  statusOptions,
  urgencyOptions,
  type IncidentFormErrors,
  type IncidentFormState,
} from '../../utils/incidents/incidentForm';
import type {
  IncidentImpact,
  IncidentPriority,
  IncidentSeverity,
  IncidentSlaPolicy,
  IncidentStatus,
  IncidentUrgency,
} from '../../services/incidents';

type IncidentFormModalProps = {
  opened: boolean;
  editingIncidentId: number | null;
  form: IncidentFormState;
  formErrors: IncidentFormErrors;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onUpdateForm: <K extends keyof IncidentFormState>(field: K, value: IncidentFormState[K]) => void;
};

// Helper to get priority color
const getPriorityColor = (priority: string): string => {
  const colorMap: Record<string, string> = {
    low: 'blue',
    medium: 'yellow',
    high: 'orange',
    critical: 'red',
  };
  return colorMap[priority] || 'gray';
};

// Helper to get severity color
const getSeverityColor = (severity: string): string => {
  const colorMap: Record<string, string> = {
    informational: 'blue',
    low: 'blue',
    medium: 'yellow',
    high: 'orange',
    critical: 'red',
  };
  return colorMap[severity] || 'gray';
};

// Helper to get status color
const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    new: 'blue',
    triaged: 'cyan',
    in_progress: 'violet',
    on_hold: 'gray',
    resolved: 'green',
    closed: 'dark',
  };
  return colorMap[status] || 'gray';
};

export default function IncidentFormModal({
  opened,
  editingIncidentId,
  form,
  formErrors,
  isSubmitting,
  onClose,
  onSubmit,
  onUpdateForm,
}: IncidentFormModalProps) {
  const isMobile = useMediaQuery('(max-width: 48em)');

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={editingIncidentId ? 'Edit incident ticket' : 'Create incident ticket'}
      size="lg"
      fullScreen={!!isMobile}
    >
      <Stack gap="lg">
        {/* BASIC INFORMATION SECTION */}
        <Paper p="md" radius="md" withBorder>
          <Group mb="md">
            <ThemeIcon variant="light" size="lg" radius="md" color="blue">
              <IconFileText size={20} />
            </ThemeIcon>
            <div>
              <Text fw={600} size="sm">
                Basic Information
              </Text>
              <Text size="xs" c="dimmed">
                Title and description of the incident
              </Text>
            </div>
          </Group>

          <Stack gap="sm">
            <TextInput
              label="Incident title *"
              placeholder="e.g., Suspicious authentication activity"
              value={form.title}
              error={formErrors.title}
              onChange={(event) => onUpdateForm('title', event.currentTarget.value)}
              required
            />

            <Textarea
              label="Description"
              placeholder="Provide details about the incident"
              minRows={2}
              value={form.description}
              onChange={(event) => onUpdateForm('description', event.currentTarget.value)}
            />

            <TextInput
              label="Affected asset"
              placeholder="e.g., api.example.com, database-01"
              value={form.affected_asset}
              onChange={(event) => onUpdateForm('affected_asset', event.currentTarget.value)}
            />
          </Stack>
        </Paper>

        {/* CLASSIFICATION SECTION */}
        <Paper p="md" radius="md" withBorder>
          <Group mb="md">
            <ThemeIcon variant="light" size="lg" radius="md" color="grape">
              <IconListCheck size={20} />
            </ThemeIcon>
            <div>
              <Text fw={600} size="sm">
                Classification
              </Text>
              <Text size="xs" c="dimmed">
                Categorize the incident
              </Text>
            </div>
          </Group>

          <Stack gap="sm">
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <TextInput
                label="Type"
                placeholder="e.g., Authentication, Data Breach"
                value={form.incident_type}
                onChange={(event) => onUpdateForm('incident_type', event.currentTarget.value)}
              />
              <TextInput
                label="Category"
                placeholder="e.g., Security, Infrastructure"
                value={form.category}
                onChange={(event) => onUpdateForm('category', event.currentTarget.value)}
              />
            </SimpleGrid>

            <TextInput
              label="Subcategory"
              placeholder="e.g., Brute-force, SQL Injection"
              value={form.subcategory}
              onChange={(event) => onUpdateForm('subcategory', event.currentTarget.value)}
            />

            <TextInput
              label="Environment"
              placeholder="e.g., production, staging"
              value={form.environment}
              onChange={(event) => onUpdateForm('environment', event.currentTarget.value)}
            />
          </Stack>
        </Paper>

        {/* PRIORITY & STATUS SECTION */}
        <Paper p="md" radius="md" withBorder>
          <Group mb="md">
            <ThemeIcon variant="light" size="lg" radius="md" color="red">
              <IconAlertTriangle size={20} />
            </ThemeIcon>
            <div>
              <Text fw={600} size="sm">
                Severity & Status
              </Text>
              <Text size="xs" c="dimmed">
                Priority level and current status
              </Text>
            </div>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2 }} mb="sm">
            <Select
              label="Status *"
              data={statusOptions}
              value={form.status}
              onChange={(value) => onUpdateForm('status', ((value as IncidentStatus | null) ?? form.status))}
              allowDeselect={false}
              rightSection={
                <Badge
                  size="sm"
                  color={getStatusColor(form.status)}
                  variant="light"
                  style={{ pointerEvents: 'none' }}
                >
                  {form.status}
                </Badge>
              }
              rightSectionWidth={80}
            />
            <Select
              label="Priority *"
              data={priorityOptions}
              value={form.priority}
              onChange={(value) =>
                onUpdateForm('priority', ((value as IncidentPriority | null) ?? form.priority))
              }
              allowDeselect={false}
              rightSection={
                <Badge
                  size="sm"
                  color={getPriorityColor(form.priority)}
                  variant="light"
                  style={{ pointerEvents: 'none' }}
                >
                  {form.priority}
                </Badge>
              }
              rightSectionWidth={80}
            />
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <Select
              label="Severity *"
              data={severityOptions}
              value={form.severity}
              onChange={(value) =>
                onUpdateForm('severity', ((value as IncidentSeverity | null) ?? form.severity))
              }
              allowDeselect={false}
              rightSection={
                <Badge
                  size="sm"
                  color={getSeverityColor(form.severity)}
                  variant="light"
                  style={{ pointerEvents: 'none' }}
                >
                  {form.severity}
                </Badge>
              }
              rightSectionWidth={100}
            />
            <Select
              label="Impact"
              data={impactOptions}
              value={form.impact}
              onChange={(value) => onUpdateForm('impact', ((value as IncidentImpact | null) ?? form.impact))}
              allowDeselect={false}
            />
          </SimpleGrid>
        </Paper>

        {/* SLA & TIMING SECTION */}
        <Paper p="md" radius="md" withBorder>
          <Group mb="md">
            <ThemeIcon variant="light" size="lg" radius="md" color="green">
              <IconClock size={20} />
            </ThemeIcon>
            <div>
              <Text fw={600} size="sm">
                SLA & Timing
              </Text>
              <Text size="xs" c="dimmed">
                Service level agreement and deadlines
              </Text>
            </div>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2 }} mb="sm">
            <Select
              label="SLA policy"
              data={slaOptions}
              value={form.sla_policy}
              onChange={(value) =>
                onUpdateForm('sla_policy', ((value as IncidentSlaPolicy | null) ?? form.sla_policy))
              }
              allowDeselect={false}
            />
            <Select
              label="Urgency"
              data={urgencyOptions}
              value={form.urgency}
              onChange={(value) =>
                onUpdateForm('urgency', ((value as IncidentUrgency | null) ?? form.urgency))
              }
              allowDeselect={false}
            />
          </SimpleGrid>

          <TextInput
            label="Due date *"
            type="datetime-local"
            value={form.due_at}
            error={formErrors.due_at}
            onChange={(event) => onUpdateForm('due_at', event.currentTarget.value)}
          />
        </Paper>

        {/* DETAILS SECTION */}
        <Paper p="md" radius="md" withBorder>
          <Group mb="md">
            <ThemeIcon variant="light" size="lg" radius="md" color="cyan">
              <IconTag size={20} />
            </ThemeIcon>
            <div>
              <Text fw={600} size="sm">
                Additional Details
              </Text>
              <Text size="xs" c="dimmed">
                Reporter, tags, and impact notes
              </Text>
            </div>
          </Group>

          <Stack gap="sm">
            <TextInput
              label="Reporter email *"
              placeholder="analyst@company.com"
              value={form.reporter_email}
              error={formErrors.reporter_email}
              onChange={(event) => onUpdateForm('reporter_email', event.currentTarget.value)}
              type="email"
            />

            <Textarea
              label="Customer impact"
              placeholder="Describe the impact to customers or services"
              minRows={2}
              value={form.customer_impact}
              onChange={(event) => onUpdateForm('customer_impact', event.currentTarget.value)}
            />

            <TagsInput
              label="Tags"
              placeholder="Add tags (press Enter to add)"
              value={form.tags}
              onChange={(value) => onUpdateForm('tags', value)}
              clearButtonProps={{ 'aria-label': 'Clear tags' }}
            />
          </Stack>
        </Paper>

        {/* ADVANCED DETAILS (EDIT ONLY) */}
        {editingIncidentId && (
          <>
            <Divider my="sm" />
            <Paper p="md" radius="md" bg="orange.0" withBorder>
              <Group mb="md">
                <ThemeIcon variant="light" size="lg" radius="md" color="orange">
                  <IconAlertCircle size={20} />
                </ThemeIcon>
                <div>
                  <Text fw={600} size="sm">
                    Resolution Details
                  </Text>
                  <Text size="xs" c="dimmed">
                    Only visible when editing an incident
                  </Text>
                </div>
              </Group>

              <Stack gap="sm">
                <Textarea
                  label="Mitigation steps"
                  placeholder="What actions have been taken"
                  minRows={2}
                  value={form.mitigation}
                  onChange={(event) => onUpdateForm('mitigation', event.currentTarget.value)}
                />
                <Textarea
                  label="Root cause"
                  placeholder="Why did this incident occur"
                  minRows={2}
                  value={form.root_cause}
                  onChange={(event) => onUpdateForm('root_cause', event.currentTarget.value)}
                />
                <Textarea
                  label="Resolution summary"
                  placeholder="How was this incident resolved"
                  minRows={2}
                  value={form.resolution_summary}
                  onChange={(event) => onUpdateForm('resolution_summary', event.currentTarget.value)}
                />
              </Stack>
            </Paper>
          </>
        )}

        {/* ACTION BUTTONS */}
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSubmit} loading={isSubmitting}>
            {editingIncidentId ? 'Save changes' : 'Create ticket'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

