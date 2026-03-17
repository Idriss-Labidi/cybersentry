import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from 'oidc-client-ts';
import { AuthContext, type AuthContextValue } from './authContextBase';
import userManager from '../utils/user-manager';

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

    void initializeUser();
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
      const callbackUser = await userManager.signinRedirectCallback();
      setUser(callbackUser);
    } catch (error) {
      console.error('Error during signin callback:', error);
      throw error;
    }
  };

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: !!user && !user.expired,
    login,
    logout,
    handleCallback,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
