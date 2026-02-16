import { AuthProvider } from './context/AuthContext';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Login } from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import { OAuthCallback } from './pages/OAuthCallback';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { Security } from './pages/Security';
import { Alerts } from './pages/Alerts';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { useAuth } from './context/AuthContext';
import { createTheme, MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';

// other css files are required only if
// you are using components from the corresponding package
// import '@mantine/dates/styles.css';
// import '@mantine/dropzone/styles.css';
// import '@mantine/code-highlight/styles.css';
// ...


const theme = createTheme({
  primaryColor: 'blue',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  headings: { fontFamily: 'system-ui, -apple-system, sans-serif' },
});

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/oauth-callback" element={<OAuthCallback />} />
        <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} isLoading={isLoading} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/security" element={<Security />} />
            <Route path="/dashboard/alerts" element={<Alerts />} />
            <Route path="/dashboard/analytics" element={<Analytics />} />
            <Route path="/dashboard/settings" element={<Settings />} />
          </Route>
        </Route>
        {/* Add other routes here */}
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
     <MantineProvider theme={theme}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </MantineProvider>
  );
}

export default App;
