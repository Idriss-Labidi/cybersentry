import { createContext, useContext, useEffect, useState } from 'react';
import type {ReactNode} from 'react';
import type { User } from 'oidc-client-ts';
import userManager from '../utils/user-manager';

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

  useEffect(() => {
    const initializeUser = async () => {
      try {
        const existingUser = await userManager.getUser();
        setUser(existingUser);
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeUser();
  }, []);

  const login = async () => {
    try {
      await userManager.signinRedirect();
      console.log('Login redirect initiated');
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await userManager.signoutRedirect();
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
      window.location.replace('/');
    }
  };

  const handleCallback = async () => {
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
