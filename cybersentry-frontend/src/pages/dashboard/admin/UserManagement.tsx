import { useEffect, useState } from 'react';
import type { AxiosError } from 'axios';
import {
  Alert,
  Badge,
  Button,
  Divider,
  Group,
  Modal,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
  PasswordInput,
} from '@mantine/core';
import { IconAlertTriangle, IconPencil, IconPlus, IconTrash, IconUsers } from '@tabler/icons-react';
import DashboardPageLayout from '../../../layouts/dashboard/DashboardPageLayout';
import { getProfileInfo, type UserProfile } from '../../../services/profile';
import { adminUsersApi, type CreateManagedUserPayload, type ManagedUser, type UpdateManagedUserPayload } from '../../../services/admin-users';
import { notifyError, notifySuccess } from '../../../utils/ui-notify';

const roleOptions = [
  { value: 'admin', label: 'Admin' },
  { value: 'analyst', label: 'Analyst' },
  { value: 'viewer', label: 'Viewer' },
];

const formatDateTime = (value: string | null | undefined) => {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Not available';
  }

  return date.toLocaleString();
};

type UserFormState = {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  password: string;
};

const emptyFormState: UserFormState = {
  username: '',
  email: '',
  first_name: '',
  last_name: '',
  role: 'viewer',
  is_active: true,
  password: '',
};

export const UserManagement = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [formState, setFormState] = useState<UserFormState>(emptyFormState);
  const [submitting, setSubmitting] = useState(false);

  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const profileResponse = await getProfileInfo();
      setProfile(profileResponse.data);

      if (profileResponse.data.role.toLowerCase() !== 'admin' || !profileResponse.data.organization) {
        setUsers([]);
        setError('Only organization administrators can access user management.');
        return;
      }

      const usersResponse = await adminUsersApi.getManagedUsers();
      setUsers(usersResponse.data);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ detail?: string }>;
      if (axiosError.response?.status === 403) {
        setError('Only organization administrators can access user management.');
      } else {
        setError('Unable to load organization users right now.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const openCreateModal = () => {
    setEditingUser(null);
    setFormState(emptyFormState);
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (user: ManagedUser) => {
    setEditingUser(user);
    setFormState({
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      is_active: user.is_active,
      password: '',
    });
    setError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingUser(null);
    setFormState(emptyFormState);
  };

  const handleSubmit = async () => {
    setError(null);

    if (!formState.email.trim()) {
      setError('Email is required.');
      return;
    }

    setSubmitting(true);

    try {
      if (editingUser) {
        const payload: UpdateManagedUserPayload = {
          username: formState.username.trim() || undefined,
          email: formState.email.trim(),
          first_name: formState.first_name,
          last_name: formState.last_name,
          role: formState.role,
          is_active: formState.is_active,
          password: formState.password || undefined,
        };

        await adminUsersApi.updateManagedUser(editingUser.id, payload);
        notifySuccess('User updated', `${formState.email.trim()} was updated successfully.`);
      } else {
        const payload: CreateManagedUserPayload = {
          username: formState.username.trim() || undefined,
          email: formState.email.trim(),
          first_name: formState.first_name,
          last_name: formState.last_name,
          role: formState.role,
          is_active: formState.is_active,
        };

        await adminUsersApi.createManagedUser(payload);
        notifySuccess('User created', `${formState.email.trim()} was added successfully.`);
      }

      closeModal();
      await loadUsers();
    } catch (err: unknown) {
      const axiosError = err as AxiosError<Record<string, string[] | string> & { detail?: string }>;
      const responseData = axiosError.response?.data;
      const firstError = responseData
        ? responseData.detail ?? Object.values(responseData)[0]?.[0]
        : 'Unable to save user details. Please review the fields and try again.';
      const message = typeof firstError === 'string' ? firstError : 'Unable to save user details.';
      setError(message);
      notifyError('User save failed', message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (user: ManagedUser) => {
    if (!window.confirm(`Delete ${user.full_name || user.email}? This action cannot be undone.`)) {
      return;
    }

    try {
      await adminUsersApi.deleteManagedUser(user.id);
      notifySuccess('User deleted', `${user.full_name || user.email} was removed.`);
      await loadUsers();
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ detail?: string }>;
      const message = axiosError.response?.data?.detail ?? 'Unable to delete user right now.';
      setError(message);
      notifyError('User deletion failed', message);
    }
  };

  return (
    <>
      <DashboardPageLayout
        icon={<IconUsers size={26} />}
        eyebrow="Administration"
        title="Organization user management"
        description="Create, update, or remove users in your organization from a single secure dashboard section."
        actions={
          <Button leftSection={<IconPlus size={16} />} onClick={openCreateModal}>
            Add user
          </Button>
        }
      >
        {error ? (
          <Alert color="red" title="User management unavailable" variant="light" icon={<IconAlertTriangle size={16} />}>
            {error}
          </Alert>
        ) : null}

        <Paper p="lg" radius="xl">
          <Group justify="space-between" mb="md">
            <div>
              <Text fw={800}>Organization accounts</Text>
              <Text size="sm" c="dimmed">
                Manage access for users who belong to {profile?.organization ?? 'your organization'}.
              </Text>
            </div>
            <Badge variant="light">{users.length} users</Badge>
          </Group>

          <Divider mb="md" />

          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>User</Table.Th>
                <Table.Th>Role</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Last login</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {users.length === 0 && !isLoading ? (
                <Table.Tr>
                  <Table.Td colSpan={5}>
                    <Text c="dimmed">No organization users were found.</Text>
                  </Table.Td>
                </Table.Tr>
              ) : null}

              {users.map((user) => (
                <Table.Tr key={user.id}>
                  <Table.Td>
                    <Stack gap={0}>
                      <Text fw={700}>{user.full_name || user.username}</Text>
                      <Text size="sm" c="dimmed">
                        {user.email}
                      </Text>
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light" color={user.role === 'admin' ? 'blue' : user.role === 'analyst' ? 'violet' : 'gray'}>
                      {user.role_display}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light" color={user.is_active ? 'green' : 'red'}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{formatDateTime(user.last_login)}</Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Button size="xs" variant="light" leftSection={<IconPencil size={14} />} onClick={() => openEditModal(user)}>
                        Edit
                      </Button>
                      <Button
                        size="xs"
                        color="red"
                        variant="light"
                        leftSection={<IconTrash size={14} />}
                        onClick={() => handleDelete(user)}
                      >
                        Delete
                      </Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          {isLoading ? <Text mt="md" c="dimmed">Loading organization users...</Text> : null}
        </Paper>
      </DashboardPageLayout>

      <Modal
        opened={modalOpen}
        onClose={closeModal}
        title={editingUser ? 'Edit user' : 'Add user'}
        centered
        size="lg"
      >
        <Stack>
          <SimpleGrid cols={{ base: 1, md: 2 }}>
            <TextInput
              label="First name"
              value={formState.first_name}
              onChange={(event) => {
                const value = event.currentTarget.value;
                setFormState((current) => ({ ...current, first_name: value }));
              }}
            />
            <TextInput
              label="Last name"
              value={formState.last_name}
              onChange={(event) => {
                const value = event.currentTarget.value;
                setFormState((current) => ({ ...current, last_name: value }));
              }}
            />
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, md: 2 }}>
            <TextInput
              label="Username"
              value={formState.username}
              onChange={(event) => {
                const value = event.currentTarget.value;
                setFormState((current) => ({ ...current, username: value }));
              }}
              placeholder="Leave blank to auto-generate"
            />
            <TextInput
              label="Email"
              value={formState.email}
              onChange={(event) => {
                const value = event.currentTarget.value;
                setFormState((current) => ({ ...current, email: value }));
              }}
              required
            />
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, md: 2 }}>
            <Select
              label="Role"
              data={roleOptions}
              value={formState.role}
              onChange={(value) => setFormState((current) => ({ ...current, role: value ?? 'viewer' }))}
            />
            <PasswordInput
              label={editingUser ? 'New password (optional)' : 'Password'}
              value={formState.password}
              onChange={(event) => {
                const value = event.currentTarget.value;
                setFormState((current) => ({ ...current, password: value }));
              }}
              placeholder={editingUser ? 'Leave blank to keep the current password' : ''}
            />
          </SimpleGrid>

          <Switch
            label="Account active"
            checked={formState.is_active}
            onChange={(event) => {
              const checked = event.currentTarget.checked;
              setFormState((current) => ({ ...current, is_active: checked }));
            }}
          />

          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={closeModal}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={submitting}>
              {editingUser ? 'Save changes' : 'Create user'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
};


