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
  handleCallback: () =>  Promise<void>;
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
          monitorSession: false,
        };

        const manager = new UserManager(settings);
        setUserManager(manager)
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

  const handleCallback = async () => {
    if (!userManager) {
      throw new Error('UserManager not initialized');
    }

    try {
      const user = await userManager.signinRedirectCallback();
      setUser(user);
    } catch (error) {
      console.error('Error during signin callback:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user && !user.expired,
    login,
    logout,
    handleCallback
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
