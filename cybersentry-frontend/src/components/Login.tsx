import { Button, Center } from '@mantine/core';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const { isAuthenticated, user, login, logout, isLoading } = useAuth();

  if (isLoading) {
    return <div className="login-container"><p>Loading...</p></div>;
  }

  return (
    <Center className="login-container">
      <div className="login-container">
        {isAuthenticated && user ? (
          <div className="user-info">
            <div className="welcome">
              <h2>Welcome, {user.profile?.name || user.profile?.preferred_username}!</h2>
              <div className="user-details">
                <p><strong>Email:</strong> {user.profile?.email || 'N/A'}</p>
                <p><strong>Subject:</strong> {user.profile?.sub}</p>
                {user.profile?.given_name && (
                  <p><strong>First Name:</strong> {user.profile.given_name}</p>
                )}
                {user.profile?.family_name && (
                  <p><strong>Last Name:</strong> {user.profile.family_name}</p>
                )}
              </div>
            </div>
            <Button onClick={logout}>
              Logout
            </Button>
          </div>
        ) : (
          <div className="login-form">
            <h2>CyberSentry</h2>
            <p>Please sign in with your credentials</p>
            <Button onClick={login} className="btn btn-login">
              Sign In with OIDC
            </Button>
          </div>
        )}
      </div>
    </Center>
    
  );
};
