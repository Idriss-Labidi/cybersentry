import { createContext } from 'react';
import type { PreferredTheme, ThemeMode } from '../../styles/theme';

export type ThemeContextValue = {
  colorScheme: ThemeMode;
  isDark: boolean;
  setColorScheme: (scheme: ThemeMode) => void;
  toggleColorScheme: () => void;
  preferredTheme: PreferredTheme;
  setPreferredTheme: (theme: PreferredTheme) => void;
};

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
