import axiosInstance from '../utils/axios-instance';

export type NotificationSeverity = 'low' | 'medium' | 'high';
export type NotificationTestType =
  | 'dns_health'
  | 'dns_change'
  | 'ip_reputation'
  | 'website_content_change'
  | 'github_health'
  | 'github_secret_exposure';

export interface NotificationEvent {
  id: number;
  test_type: NotificationTestType;
  test_type_label: string;
  severity: NotificationSeverity;
  score: number;
  threshold: number;
  title: string;
  detail: string;
  metadata: Record<string, unknown>;
  asset: number | null;
  asset_name: string;
  asset_value: string;
  is_read: boolean;
  read_at: string | null;
  email_status: 'pending' | 'sent' | 'failed' | 'disabled';
  webhook_status: 'pending' | 'sent' | 'failed' | 'disabled';
  created_at: string;
}

export interface NotificationSummary {
  total: number;
  unread: number;
  critical: number;
}

export interface PaginatedNotificationEvents {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results: NotificationEvent[];
}

export interface MarkAllReadResponse {
  updated: number;
}

export const getNotifications = (params?: { unread_only?: boolean }) =>
  axiosInstance.get<NotificationEvent[] | PaginatedNotificationEvents>('/api/notifications/', { params });

export const getNotificationSummary = () =>
  axiosInstance.get<NotificationSummary>('/api/notifications/summary/');

export const markNotificationRead = (id: number) =>
  axiosInstance.post<NotificationEvent>(`/api/notifications/${id}/mark_read/`);

export const markAllNotificationsRead = () =>
  axiosInstance.post<MarkAllReadResponse>('/api/notifications/mark_all_read/');

