import { createContext, useContext, useEffect, useState } from 'react';
import type {ReactNode} from 'react';
import { UserManager, User } from 'oidc-client-ts';
import type { UserManagerSettings } from 'oidc-client-ts';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userManager, setUserManager] = useState<UserManager | null>(null);

  useEffect(() => {
    const initializeUserManager = async () => {
      try {
        const settings: UserManagerSettings = {
          authority: import.meta.env.VITE_OIDC_AUTHORITY,
          client_id: import.meta.env.VITE_OIDC_CLIENT_ID,
          redirect_uri: import.meta.env.VITE_OIDC_REDIRECT_URI,
          response_type: 'code',
          response_mode: 'query',
          scope: import.meta.env.VITE_OIDC_SCOPES,
          post_logout_redirect_uri: import.meta.env.VITE_OIDC_REDIRECT_URI,
          automaticSilentRenew: true,
          loadUserInfo: true,
        };

        const manager = new UserManager(settings);
        setUserManager(manager);

        const currentUrl = new URL(window.location.href);
        const queryState = currentUrl.searchParams.get('state');
        const hashState = new URLSearchParams(currentUrl.hash.replace(/^#/, '')).get('state');
        const hasState = queryState || hashState;

        // Check if we're returning from login callback
        if (window.location.pathname === '/oauth-callback') {
          if (!hasState) {
            console.warn('OIDC callback missing state; restarting login redirect');
            await manager.clearStaleState();
            await manager.signinRedirect();
            return;
          }
          try {
            const user = await manager.signinRedirectCallback(currentUrl.href);
            setUser(user);
            // After processing the callback, send user to the main page
            window.location.replace('/');
            return;
          } catch (error) {
            console.error('Error processing login callback:', error);
          }
        }

        // Try to restore user from session when not on the callback path
        const user = await manager.getUser();
        setUser(user);
      } catch (error) {
        console.error('Error initializing UserManager:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeUserManager();
  }, []);

  const login = async () => {
    if (!userManager) return;
    try {
      await userManager.signinRedirect().then(() => {
        console.log('Login redirect initiated');
      });
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const logout = async () => {
    if (!userManager) return;
    try {
      await userManager.signoutRedirect();
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
      window.location.replace('/');
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user && !user.expired,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
