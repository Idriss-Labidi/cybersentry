import { getThemeCssVars, type ThemeMode } from '../../styles/theme';
import type { PreferredTheme } from './themeContextBase';

const STORAGE_KEY = 'cybersentry-theme';
const PREFERRED_THEME_KEY = 'cybersentry-preferred-theme';
export const DEFAULT_COLOR_SCHEME: ThemeMode = 'dark';
export const DEFAULT_PREFERRED_THEME: PreferredTheme = 'green';

const preferredThemeCssVars: Record<PreferredTheme, Record<string, string>> = {
  green: {
    '--app-accent': '#00e641',
    '--app-accent-strong': '#00c436',
    '--app-border': 'rgba(0, 230, 65, 0.18)',
    '--app-border-strong': 'rgba(0, 230, 65, 0.32)',
    '--app-hover-fill': 'rgba(0, 230, 65, 0.09)',
    '--app-active-fill': 'rgba(0, 230, 65, 0.16)',
    '--app-badge-fill': 'rgba(0, 230, 65, 0.13)',
  },
  blue: {
    '--app-accent': '#3b82f6',
    '--app-accent-strong': '#2563eb',
    '--app-border': 'rgba(59, 130, 246, 0.2)',
    '--app-border-strong': 'rgba(59, 130, 246, 0.32)',
    '--app-hover-fill': 'rgba(59, 130, 246, 0.1)',
    '--app-active-fill': 'rgba(59, 130, 246, 0.18)',
    '--app-badge-fill': 'rgba(59, 130, 246, 0.13)',
  },
  purple: {
    '--app-accent': '#8b5cf6',
    '--app-accent-strong': '#7c3aed',
    '--app-border': 'rgba(139, 92, 246, 0.2)',
    '--app-border-strong': 'rgba(139, 92, 246, 0.34)',
    '--app-hover-fill': 'rgba(139, 92, 246, 0.1)',
    '--app-active-fill': 'rgba(139, 92, 246, 0.18)',
    '--app-badge-fill': 'rgba(139, 92, 246, 0.13)',
  },
};

export function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') {
    return DEFAULT_COLOR_SCHEME;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'light' ? 'light' : DEFAULT_COLOR_SCHEME;
}

export function persistTheme(mode: ThemeMode) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, mode);
}

export function getStoredPreferredTheme(): PreferredTheme {
  if (typeof window === 'undefined') {
    return DEFAULT_PREFERRED_THEME;
  }

  const stored = window.localStorage.getItem(PREFERRED_THEME_KEY);
  if (stored === 'blue' || stored === 'purple' || stored === 'green') {
    return stored;
  }
  return DEFAULT_PREFERRED_THEME;
}

export function persistPreferredTheme(theme: PreferredTheme) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(PREFERRED_THEME_KEY, theme);
}

export function applyTheme(mode: ThemeMode) {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  root.dataset.theme = mode;
  root.style.colorScheme = mode;

  Object.entries(getThemeCssVars(mode)).forEach(([name, value]) => {
    root.style.setProperty(name, value);
  });
}

export function applyPreferredTheme(theme: PreferredTheme) {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  root.dataset.preferredTheme = theme;

  Object.entries(preferredThemeCssVars[theme]).forEach(([name, value]) => {
    root.style.setProperty(name, value);
  });
}

export function initializeTheme() {
  applyTheme(getStoredTheme());
  applyPreferredTheme(getStoredPreferredTheme());
}
