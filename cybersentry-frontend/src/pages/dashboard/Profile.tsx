import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Group,
  Modal,
  Paper,
  PasswordInput,
  SimpleGrid,
  Stack,
  Table,
  Text,
} from '@mantine/core';
import { IconAlertTriangle, IconCheck, IconLock, IconUser } from '@tabler/icons-react';
import type { AxiosError } from 'axios';
import DashboardPageLayout, { DashboardStatCards } from '../../layouts/dashboard/DashboardPageLayout';
import {
  changePassword,
  getLoginHistory,
  getProfileInfo,
  getSecurityStatus,
  getSessionInfo,
  type LoginHistoryEntry,
  type SecurityStatus,
  type SessionInfo,
  type UserProfile,
} from '../../services/profile';

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

export const Profile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(null);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  const fetchProfileData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [profileRes, sessionRes, historyRes, securityRes] = await Promise.all([
        getProfileInfo(),
        getSessionInfo(),
        getLoginHistory(),
        getSecurityStatus(),
      ]);

      setProfile(profileRes.data);
      setSessionInfo(sessionRes.data);
      setLoginHistory(historyRes.data.entries ?? []);
      setSecurityStatus(securityRes.data);
    } catch {
      setError('Failed to load your profile information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchProfileData();
  }, []);

  const stats = useMemo(
    () => [
      { label: 'Role', value: profile?.role ?? 'Not available', hint: 'Current access level' },
      {
        label: 'Organization',
        value: profile?.organization ?? 'Unassigned',
        hint: 'Workspace ownership',
      },
      {
        label: 'Last login',
        value: sessionInfo?.last_login ? new Date(sessionInfo.last_login).toLocaleDateString() : 'Unknown',
        hint: 'Latest successful sign-in',
      },
      {
        label: 'Suspicious activity',
        value: securityStatus?.suspicious ? 'Detected' : 'None',
        hint: 'Based on recent sign-ins',
      },
    ],
    [profile, sessionInfo, securityStatus]
  );

  const handlePasswordSubmit = async () => {
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!oldPassword || !newPassword) {
      setPasswordError('Please provide both current and new password.');
      return;
    }

    setPasswordSubmitting(true);

    try {
      await changePassword({ old_password: oldPassword, new_password: newPassword });
      setPasswordSuccess('Password updated successfully.');
      setOldPassword('');
      setNewPassword('');
      setPasswordModalOpen(false);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<Record<string, string[]>>;
      const responseData = axiosError.response?.data;
      const firstError = responseData
        ? Object.values(responseData)[0]?.[0]
        : 'Unable to change password. Please verify your current password.';
      setPasswordError(firstError || 'Unable to change password.');
    } finally {
      setPasswordSubmitting(false);
    }
  };

  return (
    <>
      <DashboardPageLayout
        icon={<IconUser size={26} />}
        eyebrow="Profile"
        title="User identity and authentication security"
        description="Review account identity, sign-in history, session details, and authentication posture in one place."
      >
        {error ? (
          <Alert color="red" title="Unable to load profile" variant="light">
            {error}
          </Alert>
        ) : null}

        {passwordSuccess ? (
          <Alert color="green" title="Password changed" variant="light" icon={<IconCheck size={16} />}>
            {passwordSuccess}
          </Alert>
        ) : null}

        <DashboardStatCards items={stats} />

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          <Paper p="lg" radius="xl">
            <Text fw={800} mb="sm">
              Core identity
            </Text>
            <Stack gap="xs">
              <Text>
                <strong>Full name:</strong> {profile?.full_name ?? 'Not available'}
              </Text>
              <Text>
                <strong>Email:</strong> {profile?.email ?? 'Not available'}
              </Text>
              <Text>
                <strong>Role:</strong> {profile?.role ?? 'Not available'}
              </Text>
              <Text>
                <strong>Organization:</strong> {profile?.organization ?? 'Unassigned'}
              </Text>
            </Stack>
          </Paper>

          <Paper p="lg" radius="xl">
            <Group justify="space-between" align="center" mb="sm">
              <Text fw={800}>Security and authentication</Text>
              <Button leftSection={<IconLock size={16} />} onClick={() => setPasswordModalOpen(true)}>
                Change Password
              </Button>
            </Group>
            <Stack gap="xs">
              <Text>
                <strong>Last login:</strong> {formatDateTime(sessionInfo?.last_login)}
              </Text>
              <Text>
                <strong>Current IP:</strong> {sessionInfo?.current_session.ip_address || 'Not available'}
              </Text>
              <Text lineClamp={2}>
                <strong>User agent:</strong> {sessionInfo?.current_session.user_agent || 'Not available'}
              </Text>
              {securityStatus ? (
                <Alert
                  mt="sm"
                  variant="light"
                  color={securityStatus.suspicious ? 'orange' : 'green'}
                  icon={
                    securityStatus.suspicious ? <IconAlertTriangle size={16} /> : <IconCheck size={16} />
                  }
                >
                  {securityStatus.message}
                </Alert>
              ) : null}
            </Stack>
          </Paper>
        </SimpleGrid>

        <Paper p="lg" radius="xl">
          <Group justify="space-between" mb="md">
            <Text fw={800}>Recent login history</Text>
            <Badge variant="light">{loginHistory.length} entries</Badge>
          </Group>

          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Date &amp; time</Table.Th>
                <Table.Th>IP address</Table.Th>
                <Table.Th>Device / Browser</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {loginHistory.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={3}>
                    <Text c="dimmed">No login history available yet.</Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                loginHistory.map((entry) => (
                  <Table.Tr key={`${entry.timestamp}-${entry.ip_address || 'no-ip'}`}>
                    <Table.Td>{formatDateTime(entry.timestamp)}</Table.Td>
                    <Table.Td>{entry.ip_address || 'Not available'}</Table.Td>
                    <Table.Td>{entry.user_agent || 'Not available'}</Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Paper>

        {isLoading ? <Text c="dimmed">Loading profile details...</Text> : null}
      </DashboardPageLayout>

      <Modal
        opened={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        title="Change password"
        centered
      >
        <Stack>
          {passwordError ? (
            <Alert color="red" variant="light">
              {passwordError}
            </Alert>
          ) : null}
          <PasswordInput
            label="Current password"
            value={oldPassword}
            onChange={(event) => setOldPassword(event.currentTarget.value)}
            required
          />
          <PasswordInput
            label="New password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.currentTarget.value)}
            required
          />
          <Button onClick={handlePasswordSubmit} loading={passwordSubmitting}>
            Update password
          </Button>
        </Stack>
      </Modal>
    </>
  );
};

