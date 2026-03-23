import axiosInstance from '../utils/axios-instance';

export interface UserProfile {
  full_name: string;
  email: string;
  role: string;
  organization: string | null;
}

export interface SessionInfo {
  last_login: string | null;
  current_session: {
    ip_address: string | null;
    user_agent: string;
  };
}

export interface LoginHistoryEntry {
  timestamp: string;
  ip_address: string | null;
  user_agent: string;
}

export interface LoginHistoryResponse {
  entries: LoginHistoryEntry[];
}

export interface SecurityStatus {
  suspicious: boolean;
  message: string;
  recent_ip_count: number;
}

export interface ChangePasswordPayload {
  old_password: string;
  new_password: string;
}

export const getProfileInfo = () => axiosInstance.get<UserProfile>('/api/profile/');

export const getSessionInfo = () => axiosInstance.get<SessionInfo>('/api/profile/session-info/');

export const getLoginHistory = () => axiosInstance.get<LoginHistoryResponse>('/api/profile/login-history/');

export const getSecurityStatus = () => axiosInstance.get<SecurityStatus>('/api/profile/security-status/');

export const changePassword = (data: ChangePasswordPayload) =>
  axiosInstance.post('/api/profile/change-password/', data);

