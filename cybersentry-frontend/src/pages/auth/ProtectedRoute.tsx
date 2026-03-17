import { Center, Loader, Stack, Text } from '@mantine/core';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  isAuthenticated: boolean;
  isLoading: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ isAuthenticated, isLoading }) => {
  const location = useLocation();

  if (isLoading) {
    return (
      <Center className="auth-shell">
        <Stack gap="sm" align="center">
          <Loader color="brand" />
          <Text fw={700}>Verifying session</Text>
          <Text size="sm" c="dimmed" ta="center" maw={360}>
            Restoring credentials and loading the protected workspace.
          </Text>
        </Stack>
      </Center>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
