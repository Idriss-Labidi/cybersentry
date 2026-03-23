import { createContext } from 'react';
import type { ThemeMode } from '../../styles/theme';

export type PreferredTheme = 'green' | 'blue' | 'purple';

export type ThemeContextValue = {
  colorScheme: ThemeMode;
  isDark: boolean;
  setColorScheme: (scheme: ThemeMode) => void;
  toggleColorScheme: () => void;
  preferredTheme: PreferredTheme;
  setPreferredTheme: (theme: PreferredTheme) => void;
};

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
