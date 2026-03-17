import type { FC } from 'react';
import {
  Anchor,
  Burger,
  Button,
  Container,
  Group,
  HoverCard,
  Paper,
  Stack,
  UnstyledButton,
} from '@mantine/core';
import { Link } from 'react-router-dom';
import type { LandingNavLink } from './LandingLayout';
import BrandMark from './BrandMark';
import ThemeToggleButton from './ThemeToggleButton';

interface LandingHeaderProps {
  mobileOpened: boolean;
  setMobileOpened: (value: boolean) => void;
  links: LandingNavLink[];
}

export const LandingHeader: FC<LandingHeaderProps> = ({
  mobileOpened,
  setMobileOpened,
  links,
}) => {
  return (
    <Paper
      radius={0}
      withBorder={false}
      style={{
        background: 'transparent',
        borderBottom: '1px solid var(--app-border)',
        boxShadow: 'none',
      }}
    >
      <Container size="xl">
        <Group justify="space-between" align="center" h={82}>
          <Anchor component={Link} to="/" style={{ textDecoration: 'none' }}>
            <BrandMark compact />
          </Anchor>

          <Group gap="lg" visibleFrom="sm">
            {links.map((link) =>
              link.children ? (
                <HoverCard
                  key={link.label}
                  width={260}
                  shadow="md"
                  withArrow
                  openDelay={100}
                  closeDelay={150}
                >
                  <HoverCard.Target>
                    <UnstyledButton fz="sm" fw={700} c="dimmed" style={{ cursor: 'pointer' }}>
                      {link.label}
                    </UnstyledButton>
                  </HoverCard.Target>
                  <HoverCard.Dropdown>
                    <Stack gap="xs">
                      {link.children.map((child) => (
                        <Anchor
                          key={child.label}
                          component={Link}
                          to={child.href}
                          fz="sm"
                          fw={600}
                          c="dimmed"
                        >
                          {child.label}
                        </Anchor>
                      ))}
                    </Stack>
                  </HoverCard.Dropdown>
                </HoverCard>
              ) : (
                <Anchor key={link.label} href={link.href} c="dimmed" fz="sm" fw={700}>
                  {link.label}
                </Anchor>
              )
            )}

            <ThemeToggleButton />
            <Button component={Link} to="/login" variant="light">
              Sign in
            </Button>
            <Button component="a" href="/#contact">
              Talk to sales
            </Button>
          </Group>

          <Burger
            opened={mobileOpened}
            onClick={() => setMobileOpened(!mobileOpened)}
            hiddenFrom="sm"
            size="sm"
            aria-label="Toggle navigation menu"
          />
        </Group>
      </Container>
    </Paper>
  );
};
