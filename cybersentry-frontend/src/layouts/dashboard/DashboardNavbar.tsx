import { Divider, NavLink, Paper, ScrollArea, Stack, Text } from '@mantine/core';
import {
  IconAlertTriangle,
  IconAnalyze,
  IconBrandGithub,
  IconDashboard,
  IconServer2,
  IconShield,
  IconShieldCheck,
  IconWorldWww,
  IconTicket,
} from '@tabler/icons-react';
import type { TablerIcon } from '@tabler/icons-react';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import BrandMark from '../../components/BrandMark';

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
  { id: 'assets', icon: IconServer2, label: 'Assets', href: '/dashboard/assets' },
  { id: 'security', icon: IconShield, label: 'Security', href: '/dashboard/security' },
  { id: 'alerts', icon: IconAlertTriangle, label: 'Alerts', href: '/dashboard/alerts' },
  { id: 'incidents', icon: IconTicket, label: 'Incidents', href: '/dashboard/incidents' },
  { id: 'analytics', icon: IconAnalyze, label: 'Analytics', href: '/dashboard/analytics' },
  { id: 'github', icon: IconBrandGithub, label: 'GitHub', href: '/dashboard/github' },
  { id: 'dns-intelligence', icon: IconWorldWww, label: 'DNS Intelligence', href: '/dashboard/dns-intelligence' },
  {
    id: 'advanced-security',
    icon: IconShieldCheck,
    label: 'IP Intelligence',
    href: '/dashboard/ip-intelligence',
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

  const handleSectionToggle = (id: string, value: boolean) => {
    setOpenedSections((prev) => ({ ...prev, [id]: value }));
  };

  return (
    <Stack h="100%" gap="md">
      <BrandMark compact />

      <Paper p="md" radius="xl" style={{ background: 'var(--app-surface-soft)' }}>
        <Text size="xs" tt="uppercase" fw={800} c="dimmed" style={{ letterSpacing: '0.08em' }}>
          Workspace status
        </Text>
        <Text mt="sm" fw={800} size="lg">
          Active
        </Text>
        <Text size="sm" c="dimmed" mt={4}>
          Routes, auth, and tool workflows stay intact while this branch upgrades the visual layer.
        </Text>
      </Paper>

      <Divider />

      <ScrollArea style={{ flex: 1 }}>
        <Stack gap="xs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const matchesItemHref =
              !!item.href &&
              (location.pathname === item.href ||
                (item.href !== '/dashboard' && location.pathname.startsWith(`${item.href}/`)) ||
                (item.id === 'advanced-security' && location.pathname === '/dashboard/advanced-scanner'));
            const isActiveParent = item.href
              ? matchesItemHref
              : item.children?.some((child) => location.pathname === child.href);
            const isOpen = item.children
              ? openedSections[item.id] ?? item.children.some((child) => location.pathname.startsWith(child.href))
              : false;

            if (item.children) {
              return (
                <NavLink
                  key={item.id}
                  label={item.label}
                  leftSection={Icon ? <Icon size="1rem" /> : undefined}
                  childrenOffset={28}
                  opened={isOpen}
                  onChange={(value) => handleSectionToggle(item.id, value)}
                  active={!!isActiveParent}
                  styles={{
                    root: {
                      background: isActiveParent ? 'var(--app-active-fill)' : 'transparent',
                      borderColor: isActiveParent ? 'var(--app-border-strong)' : 'transparent',
                    },
                  }}
                >
                  {item.children.map((child) => (
                    <NavLink
                      key={child.id}
                      component={Link}
                      to={child.href}
                      label={child.label}
                      active={location.pathname === child.href}
                      styles={{
                        root: {
                          background:
                            location.pathname === child.href ? 'var(--app-active-fill)' : 'transparent',
                          borderColor:
                            location.pathname === child.href ? 'var(--app-border-strong)' : 'transparent',
                        },
                      }}
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
                styles={{
                  root: {
                    background: isActiveParent ? 'var(--app-active-fill)' : 'transparent',
                    borderColor: isActiveParent ? 'var(--app-border-strong)' : 'transparent',
                  },
                }}
              />
            );
          })}
        </Stack>
      </ScrollArea>
    </Stack>
  );
};

export default DashboardNavBar;
