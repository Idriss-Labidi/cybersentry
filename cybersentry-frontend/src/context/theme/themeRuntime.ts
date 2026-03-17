import { getThemeCssVars, type ThemeMode } from '../../styles/theme';

const STORAGE_KEY = 'cybersentry-theme';
export const DEFAULT_COLOR_SCHEME: ThemeMode = 'dark';

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

export function initializeTheme() {
  applyTheme(getStoredTheme());
}
