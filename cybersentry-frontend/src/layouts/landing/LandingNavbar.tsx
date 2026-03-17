import type { FC } from 'react';
import { Button, Divider, Group, NavLink, ScrollArea, Stack, Text } from '@mantine/core';
import { Link } from 'react-router-dom';
import type { LandingNavLink } from './LandingLayout';
import BrandMark from '../../components/BrandMark';
import ThemeToggleButton from '../../components/ThemeToggleButton';

const LandingNavbar: FC<{ links: LandingNavLink[] }> = ({ links }) => {
  return (
    <ScrollArea p="lg">
      <Stack gap="md">
        <BrandMark compact />
        <Text size="sm" c="dimmed">
          Browse the public product pages, jump into any security tool, or sign in to the dashboard.
        </Text>

        <Divider />

        {links.map((link) =>
          link.children ? (
            <NavLink key={link.label} label={link.label}>
              {link.children.map((child) => (
                <NavLink key={child.label} component={Link} to={child.href} label={child.label} />
              ))}
            </NavLink>
          ) : (
            <NavLink
              key={link.label}
              component="a"
              href={link.href}
              label={link.label}
            />
          )
        )}

        <Divider />

        <Group justify="space-between" px="sm">
          <ThemeToggleButton />
          <Group gap="xs">
            <Button component={Link} to="/login" variant="light" size="xs">
              Sign in
            </Button>
            <Button component="a" href="/#contact" size="xs">
              Contact
            </Button>
          </Group>
        </Group>
      </Stack>
    </ScrollArea>
  );
};

export default LandingNavbar;
