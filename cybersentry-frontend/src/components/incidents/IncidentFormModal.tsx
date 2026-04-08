import {
  Button,
  Group,
  Modal,
  Select,
  SimpleGrid,
  Stack,
  TagsInput,
  TextInput,
  Textarea,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
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
      size="xl"
      fullScreen={!!isMobile}
    >
      <Stack gap="md">
        <TextInput
          label="Title"
          placeholder="Suspicious authentication activity"
          value={form.title}
          error={formErrors.title}
          onChange={(event) => onUpdateForm('title', event.currentTarget.value)}
          required
        />

        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <TextInput
            label="Short code"
            placeholder="INC-2026-001"
            value={form.short_code}
            onChange={(event) => onUpdateForm('short_code', event.currentTarget.value)}
          />
          <TextInput
            label="Incident type"
            placeholder="Authentication"
            value={form.incident_type}
            onChange={(event) => onUpdateForm('incident_type', event.currentTarget.value)}
          />
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <TextInput
            label="Category"
            placeholder="Identity"
            value={form.category}
            onChange={(event) => onUpdateForm('category', event.currentTarget.value)}
          />
          <TextInput
            label="Subcategory"
            placeholder="Brute-force"
            value={form.subcategory}
            onChange={(event) => onUpdateForm('subcategory', event.currentTarget.value)}
          />
        </SimpleGrid>

        <TextInput
          label="Affected asset"
          placeholder="api.example.com"
          value={form.affected_asset}
          onChange={(event) => onUpdateForm('affected_asset', event.currentTarget.value)}
        />

        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          <Select
            label="Status"
            data={statusOptions}
            value={form.status}
            onChange={(value) => onUpdateForm('status', ((value as IncidentStatus | null) ?? form.status))}
            allowDeselect={false}
          />
          <Select
            label="Priority"
            data={priorityOptions}
            value={form.priority}
            onChange={(value) =>
              onUpdateForm('priority', ((value as IncidentPriority | null) ?? form.priority))
            }
            allowDeselect={false}
          />
          <Select
            label="Severity"
            data={severityOptions}
            value={form.severity}
            onChange={(value) =>
              onUpdateForm('severity', ((value as IncidentSeverity | null) ?? form.severity))
            }
            allowDeselect={false}
          />
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          <Select
            label="Impact"
            data={impactOptions}
            value={form.impact}
            onChange={(value) => onUpdateForm('impact', ((value as IncidentImpact | null) ?? form.impact))}
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
          <Select
            label="SLA policy"
            data={slaOptions}
            value={form.sla_policy}
            onChange={(value) =>
              onUpdateForm('sla_policy', ((value as IncidentSlaPolicy | null) ?? form.sla_policy))
            }
            allowDeselect={false}
          />
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <TextInput
            label="Due at"
            type="datetime-local"
            value={form.due_at}
            error={formErrors.due_at}
            onChange={(event) => onUpdateForm('due_at', event.currentTarget.value)}
          />
          <TextInput
            label="Reporter email"
            placeholder="analyst@company.com"
            value={form.reporter_email}
            error={formErrors.reporter_email}
            onChange={(event) => onUpdateForm('reporter_email', event.currentTarget.value)}
          />
        </SimpleGrid>

        <TextInput
          label="Environment"
          placeholder="production"
          value={form.environment}
          onChange={(event) => onUpdateForm('environment', event.currentTarget.value)}
        />

        <TagsInput
          label="Tags"
          placeholder="Press Enter after each tag"
          value={form.tags}
          onChange={(value) => onUpdateForm('tags', value)}
        />

        <Textarea
          label="Description"
          minRows={3}
          value={form.description}
          onChange={(event) => onUpdateForm('description', event.currentTarget.value)}
        />
        <Textarea
          label="Customer impact"
          minRows={2}
          value={form.customer_impact}
          onChange={(event) => onUpdateForm('customer_impact', event.currentTarget.value)}
        />
        <Textarea
          label="Mitigation"
          minRows={2}
          value={form.mitigation}
          onChange={(event) => onUpdateForm('mitigation', event.currentTarget.value)}
        />
        <Textarea
          label="Root cause"
          minRows={2}
          value={form.root_cause}
          onChange={(event) => onUpdateForm('root_cause', event.currentTarget.value)}
        />
        <Textarea
          label="Resolution summary"
          minRows={2}
          value={form.resolution_summary}
          onChange={(event) => onUpdateForm('resolution_summary', event.currentTarget.value)}
        />

        <Group justify="flex-end">
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

