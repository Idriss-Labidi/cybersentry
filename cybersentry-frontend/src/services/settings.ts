import axiosInstance from '../utils/axios-instance';
import type { PreferredTheme } from '../styles/theme';

export interface UserSettingsResponse {
  github_token: string;
  use_cache: boolean;
  cache_duration: number;
  notifications_email_enabled: boolean;
  notifications_webhook_enabled: boolean;
  slack_webhook_url: string;
  teams_webhook_url: string;
  notification_alert_threshold: number | null;
  preferred_theme: PreferredTheme;
}

export interface UpdateUserSettingsPayload {
  github_token?: string | null;
  use_cache?: boolean;
  cache_duration?: number;
  notifications_email_enabled?: boolean;
  notifications_webhook_enabled?: boolean;
  slack_webhook_url?: string | null;
  teams_webhook_url?: string | null;
  notification_alert_threshold?: number;
  preferred_theme?: PreferredTheme;
}

export const getUserSettings = () => axiosInstance.get<UserSettingsResponse>('/api/settings/');

export const updateUserSettings = (data: UpdateUserSettingsPayload) =>
  axiosInstance.put<UserSettingsResponse>('/api/settings/', data);

