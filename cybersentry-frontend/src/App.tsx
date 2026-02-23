import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
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
import { DnsLookup } from './pages/DnsLookup';
import { DnsHealthCheck } from './pages/DnsHealthCheck';
import { DnsPropagation } from './pages/DnsPropagation';
import GitHubHealthCheck from './pages/GitHubHealthCheck';
import GitHubHealthCheckHistory from './pages/GitHubHealthCheckHistory';
import { WhoisLookup } from './pages/WhoisLookup';
import { IpReputation } from './pages/IpReputation';
import { ReverseIp } from './pages/ReverseIp';
import { useAuth } from './context/AuthContext';
import '@mantine/core/styles.css';
import LandingLayout from './components/LandingLayout';

// other css files are required only if
// you are using components from the corresponding package
// import '@mantine/dates/styles.css';
// import '@mantine/dropzone/styles.css';
// import '@mantine/code-highlight/styles.css';
// ...

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<LandingLayout />} >
          <Route path='/' element={<Landing/>}></Route>
          <Route path="/tools/dns-lookup" element={<DnsLookup />} />
          <Route path="/tools/dns-propagation" element={<DnsPropagation />} />
          <Route path="/tools/dns-health-check" element={<DnsHealthCheck />} />
          <Route path="/tools/whois-lookup" element={<WhoisLookup />} />
          <Route path="/tools/ip-reputation" element={<IpReputation />} />
          <Route path="/tools/reverse-ip" element={<ReverseIp />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/oauth-callback" element={<OAuthCallback />} />
        <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} isLoading={isLoading} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/security" element={<Security />} />
            <Route path="/dashboard/alerts" element={<Alerts />} />
            <Route path="/dashboard/analytics" element={<Analytics />} />
            <Route path="/dashboard/settings" element={<Settings />} />
            <Route path="/dashboard/github" element={<GitHubHealthCheck />} />
            <Route path="/dashboard/github/history" element={<GitHubHealthCheckHistory />} />
          </Route>
        </Route>
        {/* Add other routes here */}
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
