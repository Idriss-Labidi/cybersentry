import { AppShell, Stack, NavLink, ScrollArea } from '@mantine/core';
import { IconDashboard, IconShield, IconAlertTriangle, IconSettings, IconAnalyze } from '@tabler/icons-react';
import { Link, useLocation } from 'react-router-dom';

const DashboardSidebar = () => {
  const location = useLocation();

  const navItems = [
    {
      icon: IconDashboard,
      label: 'Dashboard',
      href: '/dashboard',
    },
    {
      icon: IconShield,
      label: 'Security',
      href: '/dashboard/security',
    },
    {
      icon: IconAlertTriangle,
      label: 'Alerts',
      href: '/dashboard/alerts',
    },
    {
      icon: IconAnalyze,
      label: 'Analytics',
      href: '/dashboard/analytics',
    },
    {
      icon: IconSettings,
      label: 'Settings',
      href: '/dashboard/settings',
    },
  ];

  return (
    <AppShell.Navbar p="md">
      <ScrollArea>
        <Stack gap="xs">
          {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;

            return (
            <NavLink
              key={item.href}
              component={Link}
              to={item.href}
              label={item.label}
              leftSection={<Icon size="1rem" />}
              active={isActive}
            />
          );
        })}
        </Stack>
      </ScrollArea>
    </AppShell.Navbar>
  );
};

export default DashboardSidebar;








