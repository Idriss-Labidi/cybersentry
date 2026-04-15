import { AuthProvider } from './context/auth/AuthContext';
import { ThemeProvider } from './context/theme/ThemeContext';
import { Notifications } from '@mantine/notifications';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Login } from './pages/auth/Login';
import ProtectedRoute from './pages/auth/ProtectedRoute';
import DashboardLayout from './layouts/dashboard/DashboardLayout';
import { OAuthCallback } from './pages/auth/OAuthCallback';
import { Landing } from './pages/landing/Landing';
import { Dashboard } from './pages/dashboard/Dashboard';
import { AssetsList } from './pages/dashboard/assets/AssetsList';
import { AssetDetail } from './pages/dashboard/assets/AssetDetail';
import { Profile } from './pages/dashboard/Profile';
import { Alerts } from './pages/dashboard/Alerts';
import { Analytics } from './pages/dashboard/Analytics';
import { Settings } from './pages/dashboard/Settings';
import { UserManagement } from './pages/dashboard/admin/UserManagement';
import { Dns } from './pages/dashboard/dns-intelligence/Dns';
import { DnsLookup } from './pages/tools/dns/DnsLookup';
import { DnsHealthCheck } from './pages/tools/dns/DnsHealthCheck';
import { DnsPropagation } from './pages/tools/dns/dns-propagation/DnsPropagation';
import GitHub from './pages/dashboard/github-health/GitHub';
import { WhoisLookup } from './pages/tools/domain/WhoisLookup';
import { IpReputation } from './pages/tools/ip/IpReputation';
import { ReverseIp } from './pages/tools/ip/ReverseIp';
import { EmailSecurityAnalyzer } from './pages/tools/email/EmailSecurityAnalyzer';
import { TyposquattingDetection } from './pages/tools/domain/TyposquattingDetection';
import { AdvancedSecurityScanner } from './pages/dashboard/advanced-security-scanner/AdvancedSecurityScanner';
import { useAuth } from './context/auth/useAuth';
import LandingLayout from './layouts/landing/LandingLayout';
import { IncidentsList } from './pages/dashboard/incidents/IncidentsList';
import { IncidentDetail } from './pages/dashboard/incidents/IncidentDetail';
import NotFound from './pages/dashboard/NotFound';

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
          <Route path="/tools/email-security" element={<EmailSecurityAnalyzer />} />
          <Route path="/tools/typosquatting" element={<TyposquattingDetection />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/oauth-callback" element={<OAuthCallback />} />
        <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} isLoading={isLoading} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/assets" element={<AssetsList />} />
            <Route path="/dashboard/assets/:id" element={<AssetDetail />} />
            <Route path="/dashboard/profile" element={<Profile />} />
            <Route path="/dashboard/alerts" element={<Alerts />} />
            <Route path="/dashboard/incidents" element={<IncidentsList />} />
            <Route path="/dashboard/incidents/:id" element={<IncidentDetail />} />
            <Route path="/dashboard/analytics" element={<Analytics />} />
            <Route path="/dashboard/settings" element={<Settings />} />
            <Route path="/dashboard/admin/users" element={<UserManagement />} />
            <Route path="/dashboard/dns-intelligence" element={<Dns />} />
            <Route path="/dashboard/github" element={<GitHub />} />
            <Route path="/dashboard/github/history" element={<GitHub initialTab="history" />} />
            <Route path="/dashboard/advanced-scanner" element={<AdvancedSecurityScanner />} />
            <Route path="/dashboard/ip-intelligence" element={<AdvancedSecurityScanner />} />
            <Route path="/dashboard/*" element={<NotFound />} />
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
      <Notifications position="top-right" zIndex={3000} limit={5} />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
