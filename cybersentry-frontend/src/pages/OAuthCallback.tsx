import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Center, Text } from '@mantine/core';
import { useAuth } from "../context/AuthContext";

export const OAuthCallback = () => {
  const navigate = useNavigate();
  const { handleCallback, isLoading } = useAuth();
  const hasRun = useRef(false);

  useEffect(() => {
    if (isLoading) return; // Wait for userManager to be initialized
    if (hasRun.current) return;
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

    run();
  }, [isLoading, handleCallback, navigate]);

  return (
    <Center>
      <Text>Redirecting to dashboard. Please wait...</Text>
    </Center>
  );
};