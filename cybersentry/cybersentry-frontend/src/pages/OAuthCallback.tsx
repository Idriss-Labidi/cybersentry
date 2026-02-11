import { useEffect } from 'react';
import { useNavigate } from '../hooks/useNavigate';

export const OAuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // The AuthContext handles the callback processing
    // Redirect to home after processing
    const timer = setTimeout(() => {
      navigate('/');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      fontSize: '18px',
      color: '#666',
    }}>
      <p>Processing login... Redirecting to dashboard...</p>
    </div>
  );
};
