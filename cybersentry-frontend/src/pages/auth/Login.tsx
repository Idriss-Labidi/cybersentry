import { Button, Center, Container, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { IconArrowRight, IconLogout, IconShieldLock } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/auth/useAuth';
import BrandMark from '../../components/BrandMark';

export const Login = () => {
  const { isAuthenticated, user, login, logout, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Center className="auth-shell">
        <Stack gap="sm" align="center">
          <Text fw={700}>Preparing secure sign-in</Text>
          <Text size="sm" c="dimmed">
            Checking for an existing identity session.
          </Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Container size="sm" py="xl">
      <Center className="auth-shell">
        <Paper className="app-hero-card" p={{ base: 'lg', sm: 'xl' }} radius="xl" maw={560} w="100%">
          <Stack gap="xl">
            <BrandMark />

            <Stack gap="sm">
              <Text className="app-page-eyebrow">
                <IconShieldLock size={14} />
                OIDC authentication
              </Text>
              <Title order={1}>Access the secure workspace</Title>
              <Text c="dimmed" maw={460}>
                Sign in to unlock the protected dashboard, GitHub health workflows, and authenticated investigation history.
              </Text>
            </Stack>

            {isAuthenticated && user ? (
              <Paper p="lg" radius="xl" style={{ background: 'var(--app-surface-soft)' }}>
                <Stack gap="md">
                  <div>
                    <Text size="sm" c="dimmed">
                      Signed in as
                    </Text>
                    <Title order={3}>{user.profile?.name || user.profile?.preferred_username}</Title>
                    <Text size="sm" c="dimmed" mt={4}>
                      {user.profile?.email || 'No email available'}
                    </Text>
                  </div>

                  <Group>
                    <Button component={Link} to="/dashboard" rightSection={<IconArrowRight size={16} />}>
                      Open dashboard
                    </Button>
                    <Button
                      variant="light"
                      color="red"
                      leftSection={<IconLogout size={16} />}
                      onClick={() => void logout()}
                    >
                      Logout
                    </Button>
                  </Group>
                </Stack>
              </Paper>
            ) : (
              <Paper p="lg" radius="xl" style={{ background: 'var(--app-surface-soft)' }}>
                <Stack gap="md">
                  <Text fw={700}>Identity provider sign-in</Text>
                  <Text size="sm" c="dimmed">
                    The application uses an external OIDC flow. After successful authentication you will be returned directly to the dashboard.
                  </Text>
                  <Button onClick={() => void login()} rightSection={<IconArrowRight size={16} />}>
                    Sign in with OIDC
                  </Button>
                </Stack>
              </Paper>
            )}
          </Stack>
        </Paper>
      </Center>
    </Container>
  );
};
