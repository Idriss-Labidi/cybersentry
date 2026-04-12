import axiosInstance from '../utils/axios-instance';

export interface ManagedUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: string;
  role_display: string;
  is_active: boolean;
  organization: string | null;
  date_joined: string;
  last_login: string | null;
}

export interface CreateManagedUserPayload {
  username?: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  is_active?: boolean;
  password?: string;
}

export interface UpdateManagedUserPayload {
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  is_active?: boolean;
  password?: string;
}

const getManagedUsers = () => axiosInstance.get<ManagedUser[]>('/api/admin/users/');

const createManagedUser = (data: CreateManagedUserPayload) =>
  axiosInstance.post<ManagedUser>('/api/admin/users/', data);

const updateManagedUser = (userId: number, data: UpdateManagedUserPayload) =>
  axiosInstance.patch<ManagedUser>(`/api/admin/users/${userId}/`, data);

const deleteManagedUser = (userId: number) => axiosInstance.delete(`/api/admin/users/${userId}/`);

export const adminUsersApi = {
  getManagedUsers,
  createManagedUser,
  updateManagedUser,
  deleteManagedUser,
};


