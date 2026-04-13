import axiosInstance from '../utils/axios-instance';

export type IncidentSource = 'manual' | 'automated' | 'external_integration';
export type IncidentStatus = 'new' | 'triaged' | 'in_progress' | 'on_hold' | 'resolved' | 'closed';
export type IncidentPriority = 'low' | 'medium' | 'high' | 'critical';
export type IncidentSeverity = 'informational' | 'low' | 'medium' | 'high' | 'critical';
export type IncidentImpact = 'none' | 'low' | 'medium' | 'high' | 'widespread';
export type IncidentUrgency = 'low' | 'medium' | 'high' | 'immediate';
export type IncidentSlaPolicy = 'none' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'custom';
export type IncidentSlaState = 'on_track' | 'at_risk' | 'breached' | 'not_applicable';

export interface IncidentTicket {
  id: number;
  source: IncidentSource;
  source_event_id: string;
  deduplication_key: string;
  title: string;
  short_code: string;
  description: string;
  incident_type: string;
  category: string;
  subcategory: string;
  affected_asset: string;
  status: IncidentStatus;
  status_label: string;
  priority: IncidentPriority;
  priority_label: string;
  severity: IncidentSeverity;
  severity_label: string;
  impact: IncidentImpact;
  impact_label: string;
  urgency: IncidentUrgency;
  urgency_label: string;
  sla_policy: IncidentSlaPolicy;
  sla_policy_label: string;
  sla_state: IncidentSlaState;
  first_response_target_at: string | null;
  first_response_at: string | null;
  resolution_target_at: string | null;
  due_at: string | null;
  reported_at: string;
  detected_at: string | null;
  acknowledged_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  last_status_change_at: string;
  environment: string;
  reporter_email: string;
  customer_impact: string;
  mitigation: string;
  root_cause: string;
  resolution_summary: string;
  tags: string[];
  metadata: Record<string, unknown>;
  assigned_to: {
    id: number;
    email: string;
    full_name: string;
    role: string;
  } | null;
  created_by: {
    id: number;
    email: string;
    full_name: string;
  } | null;
  updated_by: {
    id: number;
    email: string;
    full_name: string;
  } | null;
  comments?: IncidentComment[];
  created_at: string;
  updated_at: string;
}

export interface IncidentTicketPayload {
  source?: IncidentSource;
  source_event_id?: string;
  deduplication_key?: string;
  title: string;
  short_code?: string;
  description?: string;
  incident_type?: string;
  category?: string;
  subcategory?: string;
  affected_asset?: string;
  status: IncidentStatus;
  priority: IncidentPriority;
  severity: IncidentSeverity;
  impact: IncidentImpact;
  urgency: IncidentUrgency;
  sla_policy: IncidentSlaPolicy;
  first_response_target_at?: string | null;
  first_response_at?: string | null;
  resolution_target_at?: string | null;
  due_at?: string | null;
  reported_at?: string;
  detected_at?: string | null;
  acknowledged_at?: string | null;
  resolved_at?: string | null;
  closed_at?: string | null;
  environment?: string;
  reporter_email?: string;
  customer_impact?: string;
  mitigation?: string;
  root_cause?: string;
  resolution_summary?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  assigned_to?: number | null;
}

export interface IncidentQueryParams {
  status?: IncidentStatus | 'all';
  priority?: IncidentPriority | 'all';
  severity?: IncidentSeverity | 'all';
  sla_state?: IncidentSlaState | 'all';
  source?: IncidentSource | 'all';
  search?: string;
}

export const getIncidents = (params?: IncidentQueryParams) =>
  axiosInstance.get<IncidentTicket[]>('/api/incidents/', { params });

export const getIncident = (id: number) => axiosInstance.get<IncidentTicket>(`/api/incidents/${id}/`);

export const createIncident = (payload: IncidentTicketPayload) =>
  axiosInstance.post<IncidentTicket>('/api/incidents/', payload);

export const updateIncident = (id: number, payload: IncidentTicketPayload) =>
  axiosInstance.put<IncidentTicket>(`/api/incidents/${id}/`, payload);

export const deleteIncident = (id: number) => axiosInstance.delete(`/api/incidents/${id}/`);

export const closeIncident = (id: number) => axiosInstance.post<IncidentTicket>(`/api/incidents/${id}/close/`);

export const reopenIncident = (id: number) => axiosInstance.post<IncidentTicket>(`/api/incidents/${id}/reopen/`);

export interface IncidentComment {
  id: number;
  content: string;
  author: {
    id: number;
    email: string;
    full_name: string;
  };
  created_at: string;
  updated_at: string;
}

export interface IncidentCommentPayload {
  content: string;
}

export const addComment = (id: number, payload: IncidentCommentPayload) =>
  axiosInstance.post<IncidentComment>(`/api/incidents/${id}/add_comment/`, payload);

export const assignTicket = (id: number, assignedToId: number | null) =>
  axiosInstance.post<IncidentTicket>(`/api/incidents/${id}/assign/`, { assigned_to_id: assignedToId });

export const getOrganizationUsers = () =>
  axiosInstance.get<Array<{
    id: number;
    email: string;
    full_name: string;
    role: string;
  }>>('/api/organization-users/');

