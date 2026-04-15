import {
  getThemeCssVars,
  isPreferredTheme,
  type PreferredTheme,
  type ThemeMode,
} from '../../styles/theme';

const STORAGE_KEY = 'cybersentry-theme';
const THEME_COOKIE_KEY = 'cybersentry_theme_mode';
const PREFERRED_THEME_KEY = 'cybersentry-preferred-theme';
export const DEFAULT_COLOR_SCHEME: ThemeMode = 'dark';
export const DEFAULT_PREFERRED_THEME: PreferredTheme = 'green';

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const parts = document.cookie ? document.cookie.split('; ') : [];
  for (const part of parts) {
    const [key, ...valueParts] = part.split('=');
    if (key === name) {
      return decodeURIComponent(valueParts.join('='));
    }
  }

  return null;
}

function persistCookie(name: string, value: string) {
  if (typeof document === 'undefined') {
    return;
  }

  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
}

export function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') {
    return DEFAULT_COLOR_SCHEME;
  }

  const cookieValue = readCookie(THEME_COOKIE_KEY);
  if (cookieValue === 'light' || cookieValue === 'dark') {
    return cookieValue;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'light' ? 'light' : DEFAULT_COLOR_SCHEME;
}

export function persistTheme(mode: ThemeMode) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, mode);
  persistCookie(THEME_COOKIE_KEY, mode);
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
