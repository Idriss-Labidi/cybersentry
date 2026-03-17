import { createContext } from 'react';
import type { ThemeMode } from '../theme';

export type ThemeContextValue = {
  colorScheme: ThemeMode;
  isDark: boolean;
  setColorScheme: (scheme: ThemeMode) => void;
  toggleColorScheme: () => void;
};

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
