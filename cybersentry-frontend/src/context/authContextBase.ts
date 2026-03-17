import { createContext } from 'react';
import type { User } from 'oidc-client-ts';

export interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  handleCallback: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
