import { useEffect, useRef } from 'react';
import { Center, Loader, Stack, Text } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/auth/useAuth';

export const OAuthCallback = () => {
  const navigate = useNavigate();
  const { handleCallback, isLoading } = useAuth();
  const hasRun = useRef(false);

  useEffect(() => {
    if (isLoading || hasRun.current) {
      return;
    }

    hasRun.current = true;

    const run = async () => {
      try {
        await handleCallback();
        navigate('/dashboard', { replace: true });
      } catch (err) {
        console.error('OAuth callback error:', err);
        navigate('/', { replace: true });
      }
    };

    void run();
  }, [handleCallback, isLoading, navigate]);

  return (
    <Center className="auth-shell">
      <Stack gap="sm" align="center">
        <Loader color="brand" />
        <Text fw={700}>Completing secure redirect</Text>
        <Text size="sm" c="dimmed">
          Validating the identity response and restoring your workspace session.
        </Text>
      </Stack>
    </Center>
  );
};
