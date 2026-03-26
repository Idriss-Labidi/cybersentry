import { Avatar, Badge, Breadcrumbs, Burger, Group, Menu, Paper, Text } from '@mantine/core';
import {
  IconChevronRight,
  IconLogout,
  IconSettings,
  IconShieldLock,
  IconUser,
} from '@tabler/icons-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/auth/useAuth';
import NotificationMenuButton from '../../components/NotificationMenuButton';
import ThemeToggleButton from '../../components/ThemeToggleButton';

interface DashboardHeaderProps {
  mobileOpened: boolean;
  setMobileOpened: (value: boolean) => void;
}

const labelMap: Record<string, string> = {
  dashboard: 'Overview',
  security: 'Security',
  profile: 'Profile',
  alerts: 'Alerts',
  analytics: 'Analytics',
  settings: 'Settings',
  github: 'GitHub Health',
  history: 'History',
  'advanced-scanner': 'Advanced Scanner',
};

const DashboardHeader = ({ mobileOpened, setMobileOpened }: DashboardHeaderProps) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbItems = pathSegments.map((segment, index) => {
    const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
    const label = labelMap[segment] || segment.replace(/-/g, ' ');
    const isLast = index === pathSegments.length - 1;

    return isLast ? (
      <Text key={href} size="sm" fw={700}>
        {label}
      </Text>
    ) : (
      <Text
        key={href}
        component={Link}
        to={href}
        size="sm"
        c="dimmed"
        style={{ textDecoration: 'none' }}
      >
        {label}
      </Text>
    );
  });

  const userInitials = user?.profile?.name
    ? user.profile.name
        .split(' ')
        .map((name) => name[0])
        .join('')
        .toUpperCase()
    : user?.profile?.preferred_username?.substring(0, 2).toUpperCase() || 'U';

  return (
    <Group justify="space-between" h="100%" py="md">
      <Group gap="sm">
        <Burger
          opened={mobileOpened}
          onClick={() => setMobileOpened(!mobileOpened)}
          hiddenFrom="md"
          size="sm"
          aria-label="Toggle navigation menu"
        />

        <Paper
          px="sm"
          py={8}
          radius="xl"
          style={{ background: 'var(--app-surface-soft)', borderColor: 'var(--app-border)' }}
        >
          <Group gap="xs">
            <IconShieldLock size={18} />
            <Text fw={800} size="sm">
              Mission control
            </Text>
          </Group>
        </Paper>

        {breadcrumbItems.length > 0 ? (
          <Breadcrumbs separator={<IconChevronRight size={14} />}>{breadcrumbItems}</Breadcrumbs>
        ) : null}
      </Group>

      <Group gap="md">
        <Badge size="lg" variant="light" color="brand">
          System secure
        </Badge>

        <NotificationMenuButton />

        <ThemeToggleButton />

        <Menu shadow="md" width={220} position="bottom-end">
          <Menu.Target>
            <Avatar radius="xl" style={{ cursor: 'pointer' }}>
              {userInitials}
            </Avatar>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Label>{user?.profile?.name || user?.profile?.preferred_username}</Menu.Label>
            <Menu.Divider />
            <Menu.Item component={Link} to="/dashboard/profile" leftSection={<IconUser size={15} />}>
              Profile
            </Menu.Item>
            <Menu.Item component={Link} to="/dashboard/settings" leftSection={<IconSettings size={15} />}>
              Settings
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item color="red" leftSection={<IconLogout size={15} />} onClick={() => void logout()}>
              Logout
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </Group>
  );
};

export default DashboardHeader;
