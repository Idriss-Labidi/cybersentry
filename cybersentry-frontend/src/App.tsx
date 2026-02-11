import { AuthProvider } from './context/AuthContext';
import { Login } from './components/Login';
import './App.css';

function AppContent() {
  const path = window.location.pathname;

  if (path === '/oauth-callback') {
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
  }

  return <Login />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
