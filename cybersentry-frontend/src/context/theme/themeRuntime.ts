import {
  getThemeCssVars,
  isPreferredTheme,
  type PreferredTheme,
  type ThemeMode,
} from '../../styles/theme';

const STORAGE_KEY = 'cybersentry-theme';
const PREFERRED_THEME_KEY = 'cybersentry-preferred-theme';
export const DEFAULT_COLOR_SCHEME: ThemeMode = 'dark';
export const DEFAULT_PREFERRED_THEME: PreferredTheme = 'green';

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
  if (stored && isPreferredTheme(stored)) {
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

export function applyTheme(mode: ThemeMode, preferredTheme: PreferredTheme) {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  root.dataset.theme = mode;
  root.dataset.preferredTheme = preferredTheme;
  root.style.colorScheme = mode;

  Object.entries(getThemeCssVars(mode, preferredTheme)).forEach(([name, value]) => {
    root.style.setProperty(name, value);
  });
}

export function initializeTheme() {
  applyTheme(getStoredTheme(), getStoredPreferredTheme());
}
