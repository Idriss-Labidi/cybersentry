import { Group, ActionIcon, Avatar, Menu, Breadcrumbs, Burger, Text } from '@mantine/core';
import { IconBell, IconLogout, IconUser, IconSettings, IconMoonFilled, IconSunFilled } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

interface DashboardNavbarProps {
  mobileOpened: boolean;
  setMobileOpened: (value: boolean) => void;
}

const DashboardNavbar = ({ mobileOpened, setMobileOpened }: DashboardNavbarProps) => {
  const { user, logout } = useAuth();
  const { colorScheme, toggleColorScheme} = useTheme();
  const location = useLocation();

  // Generate breadcrumbs from the current path
  const pathSegments = location.pathname
    .split('/')
    .filter((segment) => segment !== '')
    .map((segment) => ({
      title: segment.charAt(0).toUpperCase() + segment.slice(1),
      href: '/' + segment,
    }));

  const userInitials = user?.profile?.name
    ? user.profile.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : user?.profile?.preferred_username?.substring(0, 2).toUpperCase() || 'U';

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Group justify="space-between" style={{ height: '100%' }}>
      {/* Left side: Burger, Logo placeholder, and Breadcrumbs */}
      <Group gap="sm">
        <Burger opened={mobileOpened} onClick={() => setMobileOpened(!mobileOpened)} hiddenFrom="sm" size="sm" />
        <Text fw={700} size="lg">
          CyberSentry
        </Text>
        {pathSegments.length > 0 && (
          <Breadcrumbs>
            {pathSegments.map((segment) => (
              <Text key={segment.href} size="sm" c="gray">
                {segment.title}
              </Text>
            ))}
          </Breadcrumbs>
        )}
      </Group>

      {/* Right side: Notifications and User Menu */}
      <Group gap="md">
        <ActionIcon variant="subtle" size="lg">
          <IconBell style={{ width: '70%', height: '70%' }} />
        </ActionIcon>

        <ActionIcon variant='subtle' onClick={toggleColorScheme}>
          { colorScheme === 'light' ? <IconMoonFilled></IconMoonFilled> : <IconSunFilled></IconSunFilled>}
        </ActionIcon>

        <Menu shadow="md" position="bottom-end">
          <Menu.Target>
            <Avatar radius="xl" style={{ cursor: 'pointer' }}>
              {userInitials}
            </Avatar>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Item disabled>
              <Text fw={500} size="sm">
                {user?.profile?.name || user?.profile?.preferred_username}
              </Text>
            </Menu.Item>

            <Menu.Divider />

            <Menu.Item leftSection={<IconUser style={{ width: '70%', height: '70%' }} />}>
              Profile
            </Menu.Item>

            <Menu.Item leftSection={<IconSettings style={{ width: '70%', height: '70%' }} />}>
              Settings
            </Menu.Item>

            <Menu.Divider />

            <Menu.Item
              color="red"
              leftSection={<IconLogout style={{ width: '70%', height: '70%' }} />}
              onClick={handleLogout}
            >
              Logout
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </Group>
  );
};

export default DashboardNavbar;




