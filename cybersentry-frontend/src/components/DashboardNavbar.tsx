import { AppShell, Stack, NavLink, ScrollArea } from '@mantine/core';
import {
  IconDashboard,
  IconShield,
  IconAlertTriangle,
  IconSettings,
  IconAnalyze,
  IconBrandGithub,
  IconShieldCheck,
} from '@tabler/icons-react';
import type { TablerIcon } from '@tabler/icons-react';
import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

type NavChild = {
  id: string;
  label: string;
  href: string;
};

type NavItem = {
  id: string;
  icon?: TablerIcon;
  label: string;
  href?: string;
  children?: NavChild[];
};

const navItems: NavItem[] = [
  { id: 'dashboard', icon: IconDashboard, label: 'Dashboard', href: '/dashboard' },
  { id: 'security', icon: IconShield, label: 'Security', href: '/dashboard/security' },
  { id: 'alerts', icon: IconAlertTriangle, label: 'Alerts', href: '/dashboard/alerts' },
  { id: 'analytics', icon: IconAnalyze, label: 'Analytics', href: '/dashboard/analytics' },
  { id: 'settings', icon: IconSettings, label: 'Settings', href: '/dashboard/settings' },
  {
    id: 'github',
    icon: IconBrandGithub,
    label: 'GitHub',
    children: [
      { id: 'github-health', label: 'Health Check', href: '/dashboard/github' },
      { id: 'github-history', label: 'History', href: '/dashboard/github/history' },
    ],
  },
  {
    id: 'advanced-security',
    icon: IconShieldCheck,
    label: 'Advanced Security',
    href: '/dashboard/advanced-scanner',
  },
];

const DashboardNavBar = () => {
  const location = useLocation();
  const [openedSections, setOpenedSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};

    navItems.forEach((item) => {
      if (!item.children) {
        return;
      }

      initial[item.id] = item.children.some((child) => location.pathname === child.href);
    });

    return initial;
  });

  useEffect(() => {
    setOpenedSections((prev) => {
      const next = { ...prev };
      let changed = false;

      navItems.forEach((item) => {
        if (!item.children) {
          return;
        }

        const shouldBeOpen = item.children.some((child) =>
          location.pathname.startsWith(child.href)
        );

        if (shouldBeOpen && !next[item.id]) {
          next[item.id] = true;
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [location.pathname]);

  const handleSectionToggle = (id: string, value: boolean) => {
    setOpenedSections((prev) => ({ ...prev, [id]: value }));
  };

  return (
    <AppShell.Navbar p="md">
      <ScrollArea>
        <Stack gap="xs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActiveParent = item.href
              ? location.pathname === item.href
              : item.children?.some((child) => location.pathname === child.href);

            if (item.children) {
              return (
                <NavLink
                  key={item.id}
                  label={item.label}
                  leftSection={Icon ? <Icon size="1rem" /> : undefined}
                  childrenOffset={28}
                  defaultOpened={openedSections[item.id]}
                  opened={openedSections[item.id]}
                  onChange={(value) => handleSectionToggle(item.id, value)}
                  active={!!isActiveParent}
                >
                  {item.children.map((child) => (
                    <NavLink
                      key={child.id}
                      component={Link}
                      to={child.href}
                      label={child.label}
                      active={location.pathname === child.href}
                    />
                  ))}
                </NavLink>
              );
            }

            if (!item.href) {
              return null;
            }

            return (
              <NavLink
                key={item.id}
                component={Link}
                to={item.href}
                label={item.label}
                leftSection={Icon ? <Icon size="1rem" /> : undefined}
                active={!!isActiveParent}
              />
            );
          })}
        </Stack>
      </ScrollArea>
    </AppShell.Navbar>
  );
};

export default DashboardNavBar;
