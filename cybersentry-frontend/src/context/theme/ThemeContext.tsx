import { MantineProvider } from '@mantine/core';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { getMantineTheme } from '../../styles/theme';
import { ThemeContext, type ThemeContextValue } from './themeContextBase';
import { DEFAULT_COLOR_SCHEME, applyTheme, getStoredTheme, persistTheme } from './themeRuntime';

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [colorScheme, setColorScheme] = useState(() => getStoredTheme());

  useEffect(() => {
    applyTheme(colorScheme);
    persistTheme(colorScheme);
  }, [colorScheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      colorScheme,
      isDark: colorScheme === 'dark',
      setColorScheme,
      toggleColorScheme: () =>
        setColorScheme((current) => (current === 'dark' ? 'light' : 'dark')),
    }),
    [colorScheme]
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
