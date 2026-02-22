import { AppShell, Stack, NavLink, ScrollArea } from '@mantine/core';
import { IconDashboard, IconShield, IconAlertTriangle, IconSettings, IconAnalyze, IconGitBranch } from '@tabler/icons-react';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

const DashboardSidebar = () => {
  const location = useLocation();
  const [githubOpen, setGithubOpen] = useState(
    location.pathname.startsWith('/dashboard/github')
  );

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

          {/* GitHub Parent Item with Children */}
          <NavLink
            label="GitHub"
            leftSection={<IconGitBranch size="1rem" />}
            defaultOpened={githubOpen}
            opened={githubOpen}
            onChange={setGithubOpen}
            childrenOffset={28}
          >
            <NavLink
              component={Link}
              to="/dashboard/github"
              label="Health Check"
              active={location.pathname === '/dashboard/github'}
            />
            <NavLink
              component={Link}
              to="/dashboard/github/history"
              label="History"
              active={location.pathname === '/dashboard/github/history'}
            />
          </NavLink>
        </Stack>
      </ScrollArea>
    </AppShell.Navbar>
  );
};

export default DashboardSidebar;








