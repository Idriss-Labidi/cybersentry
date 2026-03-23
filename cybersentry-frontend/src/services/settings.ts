import axiosInstance from '../utils/axios-instance';
import type { PreferredTheme } from '../context/theme/themeContextBase';

export interface UserSettingsResponse {
  github_token: string;
  use_cache: boolean;
  cache_duration: number;
  preferred_theme: PreferredTheme;
}

export interface UpdateUserSettingsPayload {
  github_token?: string | null;
  use_cache?: boolean;
  cache_duration?: number;
  preferred_theme?: PreferredTheme;
}

export const getUserSettings = () => axiosInstance.get<UserSettingsResponse>('/api/settings/');

export const updateUserSettings = (data: UpdateUserSettingsPayload) =>
  axiosInstance.put<UserSettingsResponse>('/api/settings/', data);

