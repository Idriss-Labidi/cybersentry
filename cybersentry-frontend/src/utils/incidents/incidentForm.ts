import type {
  IncidentImpact,
  IncidentPriority,
  IncidentSeverity,
  IncidentSlaPolicy,
  IncidentStatus,
  IncidentTicket,
  IncidentTicketPayload,
  IncidentUrgency,
} from '../../services/incidents';

export const statusOptions = [
  { value: 'new', label: 'New' },
  { value: 'triaged', label: 'Triaged' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'on_hold', label: 'On hold' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
] as const;

export const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
] as const;

export const severityOptions = [
  { value: 'informational', label: 'Informational' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
] as const;

export const impactOptions = [
  { value: 'none', label: 'None' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'widespread', label: 'Widespread' },
] as const;

export const urgencyOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'immediate', label: 'Immediate' },
] as const;

export const slaOptions = [
  { value: 'none', label: 'No SLA' },
  { value: 'bronze', label: 'Bronze' },
  { value: 'silver', label: 'Silver' },
  { value: 'gold', label: 'Gold' },
  { value: 'platinum', label: 'Platinum' },
  { value: 'custom', label: 'Custom' },
] as const;

export type IncidentFormState = {
  title: string;
  short_code: string;
  description: string;
  incident_type: string;
  category: string;
  subcategory: string;
  affected_asset: string;
  status: IncidentStatus;
  priority: IncidentPriority;
  severity: IncidentSeverity;
  impact: IncidentImpact;
  urgency: IncidentUrgency;
  sla_policy: IncidentSlaPolicy;
  due_at: string;
  reporter_email: string;
  environment: string;
  customer_impact: string;
  mitigation: string;
  root_cause: string;
  resolution_summary: string;
  tags: string[];
};

export type IncidentFormErrors = Partial<Record<'title' | 'reporter_email' | 'due_at', string>>;

export const defaultIncidentForm: IncidentFormState = {
  title: '',
  short_code: '',
  description: '',
  incident_type: '',
  category: '',
  subcategory: '',
  affected_asset: '',
  status: 'new',
  priority: 'medium',
  severity: 'medium',
  impact: 'low',
  urgency: 'medium',
  sla_policy: 'none',
  due_at: '',
  reporter_email: '',
  environment: '',
  customer_impact: '',
  mitigation: '',
  root_cause: '',
  resolution_summary: '',
  tags: [],
};

export const formatDateTime = (value: string | null) => {
  if (!value) {
    return 'N/A';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleString();
};

export const formatForDatetimeLocalInput = (value: string | null | undefined) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const tzOffsetMs = date.getTimezoneOffset() * 60_000;
  const local = new Date(date.getTime() - tzOffsetMs);
  return local.toISOString().slice(0, 16);
};

export const toIsoOrNull = (value: string) => {
  if (!value.trim()) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const trimToUndefined = (value: string) => {
  const cleaned = value.trim();
  return cleaned ? cleaned : undefined;
};

export const buildIncidentPayload = (form: IncidentFormState): IncidentTicketPayload => {
  const dueAtIso = toIsoOrNull(form.due_at);
  const tags = form.tags.map((tag) => tag.trim()).filter(Boolean);

  return {
    title: form.title.trim(),
    status: form.status,
    priority: form.priority,
    severity: form.severity,
    impact: form.impact,
    urgency: form.urgency,
    sla_policy: form.sla_policy,
    ...(trimToUndefined(form.short_code) ? { short_code: trimToUndefined(form.short_code) } : {}),
    ...(trimToUndefined(form.description) ? { description: trimToUndefined(form.description) } : {}),
    ...(trimToUndefined(form.incident_type) ? { incident_type: trimToUndefined(form.incident_type) } : {}),
    ...(trimToUndefined(form.category) ? { category: trimToUndefined(form.category) } : {}),
    ...(trimToUndefined(form.subcategory) ? { subcategory: trimToUndefined(form.subcategory) } : {}),
    ...(trimToUndefined(form.affected_asset) ? { affected_asset: trimToUndefined(form.affected_asset) } : {}),
    ...(dueAtIso ? { due_at: dueAtIso } : {}),
    ...(trimToUndefined(form.reporter_email) ? { reporter_email: trimToUndefined(form.reporter_email) } : {}),
    ...(trimToUndefined(form.environment) ? { environment: trimToUndefined(form.environment) } : {}),
    ...(trimToUndefined(form.customer_impact) ? { customer_impact: trimToUndefined(form.customer_impact) } : {}),
    ...(trimToUndefined(form.mitigation) ? { mitigation: trimToUndefined(form.mitigation) } : {}),
    ...(trimToUndefined(form.root_cause) ? { root_cause: trimToUndefined(form.root_cause) } : {}),
    ...(trimToUndefined(form.resolution_summary)
      ? { resolution_summary: trimToUndefined(form.resolution_summary) }
      : {}),
    ...(tags.length > 0 ? { tags } : {}),
  };
};

export const incidentToFormState = (incident: IncidentTicket): IncidentFormState => ({
  title: incident.title,
  short_code: incident.short_code,
  description: incident.description,
  incident_type: incident.incident_type,
  category: incident.category,
  subcategory: incident.subcategory,
  affected_asset: incident.affected_asset,
  status: incident.status,
  priority: incident.priority,
  severity: incident.severity,
  impact: incident.impact,
  urgency: incident.urgency,
  sla_policy: incident.sla_policy,
  due_at: formatForDatetimeLocalInput(incident.due_at),
  reporter_email: incident.reporter_email,
  environment: incident.environment,
  customer_impact: incident.customer_impact,
  mitigation: incident.mitigation,
  root_cause: incident.root_cause,
  resolution_summary: incident.resolution_summary,
  tags: incident.tags,
});

export const validateIncidentForm = (form: IncidentFormState): IncidentFormErrors => {
  const errors: IncidentFormErrors = {};

  if (!form.title.trim()) {
    errors.title = 'Title is required.';
  }

  if (form.reporter_email.trim()) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(form.reporter_email.trim())) {
      errors.reporter_email = 'Provide a valid reporter email or leave it blank.';
    }
  }

  const dueAtIso = toIsoOrNull(form.due_at);
  if (form.due_at.trim() && !dueAtIso) {
    errors.due_at = 'Use a valid due date.';
  } else if (dueAtIso) {
    const dueAt = new Date(dueAtIso);
    if (dueAt.getTime() <= Date.now()) {
      errors.due_at = 'Due date must be in the future.';
    }
  }

  return errors;
};

export const getIncidentPriorityColor = (priority: IncidentPriority) => {
  if (priority === 'critical') {
    return 'red';
  }
  if (priority === 'high') {
    return 'orange';
  }
  if (priority === 'medium') {
    return 'yellow';
  }
  return 'gray';
};

export const getIncidentStatusColor = (status: IncidentStatus) => {
  if (status === 'new') {
    return 'blue';
  }
  if (status === 'in_progress') {
    return 'cyan';
  }
  if (status === 'triaged') {
    return 'teal';
  }
  if (status === 'on_hold') {
    return 'yellow';
  }
  if (status === 'resolved') {
    return 'green';
  }
  return 'gray';
};

export const getSlaStateColor = (slaState: string) => {
  if (slaState === 'breached') {
    return 'red';
  }
  if (slaState === 'at_risk') {
    return 'yellow';
  }
  if (slaState === 'on_track') {
    return 'green';
  }
  return 'gray';
};

