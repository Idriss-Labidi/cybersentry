import type { FC } from 'react';
import { Anchor, Box, Container, Group, Text } from '@mantine/core';
import BrandMark from '../../components/BrandMark';
import { buildContactTarget } from '../../data/contact-offers';

export const LandingFooter: FC = () => {
  const year = new Date().getFullYear();

  return (
    <Box component="footer" className="landing-footer">
      <Container size="xl" py="md">
        <Group justify="space-between" align="center" wrap="wrap" gap="md">
          <BrandMark compact />

          <Group gap="lg">
            <Anchor href="/#features" c="dimmed" fz="sm" fw={700}>
              Features
            </Anchor>
            <Anchor href="/#pricing" c="dimmed" fz="sm" fw={700}>
              Pricing
            </Anchor>
            <Anchor href={buildContactTarget('general', 'footer-link')} c="dimmed" fz="sm" fw={700}>
              Contact
            </Anchor>
          </Group>

          <Text c="dimmed" fz="xs">
            (c) {year} CyberSentry. Built for modern security teams.
          </Text>
        </Group>
      </Container>
    </Box>
  );
};
