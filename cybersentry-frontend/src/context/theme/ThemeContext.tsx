import { MantineProvider } from '@mantine/core';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { getMantineTheme } from '../../styles/theme';
import { ThemeContext, type ThemeContextValue } from './themeContextBase';
import {
  DEFAULT_COLOR_SCHEME,
  applyTheme,
  getStoredPreferredTheme,
  getStoredTheme,
  persistTheme,
  persistPreferredTheme,
} from './themeRuntime';

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [colorScheme, setColorScheme] = useState(() => getStoredTheme());
  const [preferredTheme, setPreferredTheme] = useState(() => getStoredPreferredTheme());

  useEffect(() => {
    applyTheme(colorScheme, preferredTheme);
    persistTheme(colorScheme);
    persistPreferredTheme(preferredTheme);
  }, [colorScheme, preferredTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      colorScheme,
      isDark: colorScheme === 'dark',
      setColorScheme,
      toggleColorScheme: () =>
        setColorScheme((current) => (current === 'dark' ? 'light' : 'dark')),
      preferredTheme,
      setPreferredTheme,
    }),
    [colorScheme, preferredTheme]
  );

  const mantineTheme = useMemo(
    () => getMantineTheme(colorScheme, preferredTheme),
    [colorScheme, preferredTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      <MantineProvider
        defaultColorScheme={DEFAULT_COLOR_SCHEME}
        forceColorScheme={colorScheme}
        theme={mantineTheme}
      >
        {children}
      </MantineProvider>
    </ThemeContext.Provider>
  );
};
