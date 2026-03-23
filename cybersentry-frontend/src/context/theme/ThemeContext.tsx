import { MantineProvider } from '@mantine/core';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { getMantineTheme } from '../../styles/theme';
import { ThemeContext, type ThemeContextValue } from './themeContextBase';
import {
  DEFAULT_COLOR_SCHEME,
  applyPreferredTheme,
  applyTheme,
  getStoredPreferredTheme,
  getStoredTheme,
  persistPreferredTheme,
  persistTheme,
} from './themeRuntime';

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [colorScheme, setColorScheme] = useState(() => getStoredTheme());
  const [preferredTheme, setPreferredTheme] = useState(() => getStoredPreferredTheme());

  useEffect(() => {
    applyTheme(colorScheme);
    persistTheme(colorScheme);
  }, [colorScheme]);

  useEffect(() => {
    applyPreferredTheme(preferredTheme);
    persistPreferredTheme(preferredTheme);
  }, [preferredTheme]);

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

  const mantineTheme = useMemo(() => getMantineTheme(colorScheme), [colorScheme]);

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
