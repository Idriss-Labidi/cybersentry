import {
  Badge,
  Button,
  Card,
  Container,
  Group,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconHome2,
  IconLayoutDashboard,
  IconSearch,
} from '@tabler/icons-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/auth/useAuth';

export default function NotFound() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const isDashboardRoute = location.pathname.startsWith('/dashboard');
  const primaryHref = isDashboardRoute && isAuthenticated ? '/dashboard' : '/';
  const primaryLabel = isDashboardRoute && isAuthenticated ? 'Back to dashboard' : 'Back to homepage';
  const secondaryHref = isDashboardRoute ? '/dashboard/assets' : '/tools/dns-lookup';
  const secondaryLabel = isDashboardRoute ? 'Open assets' : 'Open a tool';

  return (
    <Container size="lg" py={{ base: 'xl', md: 72 }} className="app-page">
      <Card
        className="app-hero-card"
        radius="xl"
        p={{ base: 'lg', sm: 'xl' }}
        style={{ overflow: 'hidden' }}
      >
        <Stack gap="xl">
          <Group justify="space-between" align="flex-start" gap="md">
            <Stack gap="md" maw={680}>
              <Badge variant="light" color="red" leftSection={<IconAlertTriangle size={14} />}>
                Error 404
              </Badge>
              <div>
                <Title order={1} style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', letterSpacing: '-0.06em', lineHeight: 0.95 }}>
                  Route not found.
                </Title>
                <Text size="lg" c="dimmed" mt="md" maw={560}>
                  The page you requested does not exist or the URL is incorrect. Use one of the recovery actions below.
                </Text>
              </div>
            </Stack>

            <ThemeIcon
              size={84}
              radius="xl"
              variant="light"
              color={isDashboardRoute ? 'brand' : 'red'}
              style={{ flexShrink: 0 }}
            >
              {isDashboardRoute ? <IconLayoutDashboard size={42} /> : <IconSearch size={42} />}
            </ThemeIcon>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
            <Card p="lg" radius="xl" style={{ background: 'var(--app-surface-soft)' }}>
              <Text size="xs" tt="uppercase" fw={800} c="dimmed" style={{ letterSpacing: '0.08em' }}>
                Requested path
              </Text>
              <Text mt="sm" fw={700} className="app-mono" style={{ wordBreak: 'break-all' }}>
                {location.pathname}
              </Text>
            </Card>

            <Card p="lg" radius="xl" style={{ background: 'var(--app-surface-soft)' }}>
              <Text size="xs" tt="uppercase" fw={800} c="dimmed" style={{ letterSpacing: '0.08em' }}>
                Suggested destination
              </Text>
              <Text mt="sm" fw={700}>
                {isDashboardRoute ? 'Return to a valid dashboard workspace route.' : 'Return to the public landing or analysis tools.'}
              </Text>
            </Card>
          </SimpleGrid>

          <Group gap="sm">
            <Button component={Link} to={primaryHref} leftSection={<IconHome2 size={16} />}>
              {primaryLabel}
            </Button>
            <Button component={Link} to={secondaryHref} variant="light">
              {secondaryLabel}
            </Button>
            <Button variant="subtle" color="gray" leftSection={<IconArrowLeft size={16} />} onClick={() => navigate(-1)}>
              Go back
            </Button>
          </Group>
        </Stack>
      </Card>
    </Container>
  );
}
