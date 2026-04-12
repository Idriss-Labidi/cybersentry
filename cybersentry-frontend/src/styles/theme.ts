import {
  ActionIcon,
  Alert,
  AppShell,
  Avatar,
  Badge,
  Burger,
  Button,
  Card,
  Chip,
  Divider,
  Input,
  Menu,
  Modal,
  NavLink,
  Paper,
  Progress,
  RingProgress,
  Select,
  Table,
  Tabs,
  TextInput,
  createTheme,
} from '@mantine/core';

export type ThemeMode = 'dark' | 'light';
export const preferredThemes = ['green', 'blue', 'purple'] as const;
export type PreferredTheme = (typeof preferredThemes)[number];

type ThemeCssVars = Record<`--${string}`, string>;

type BrandPalette = readonly [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
];

type BaseThemeDefinition = {
  black: string;
  white: string;
  cssVars: ThemeCssVars;
};

type AccentThemeDefinition = {
  brand: BrandPalette;
  cssVars: ThemeCssVars;
};

type ThemeDefinition = BaseThemeDefinition & {
  brand: BrandPalette;
};

const baseDefinitions: Record<ThemeMode, BaseThemeDefinition> = {
  dark: {
    black: '#000c02',
    white: '#edfff2',
    cssVars: {
      '--app-bg': '#000c02',
      '--app-bg-soft': '#011404',
      '--app-header': 'rgba(0, 8, 1, 0.82)',
      '--app-sidebar': 'rgba(0, 6, 1, 0.94)',
      '--app-surface': 'rgba(0, 18, 5, 0.86)',
      '--app-surface-strong': 'rgba(0, 24, 7, 0.97)',
      '--app-surface-soft': 'rgba(0, 14, 3, 0.74)',
      '--app-text': '#e0ffe8',
      '--app-text-muted': 'rgba(224, 255, 232, 0.68)',
      '--app-text-soft': 'rgba(224, 255, 232, 0.42)',
      '--app-warning': '#ffe033',
      '--app-danger': '#ff3344',
      '--app-info': '#00d4ff',
      '--app-card-shadow': '0 10px 28px rgba(0, 0, 0, 0.34)',
      '--app-card-shadow-lg': '0 16px 44px rgba(0, 0, 0, 0.46)',
      '--app-hero-gradient': 'linear-gradient(140deg, rgba(0, 20, 6, 0.96), rgba(0, 12, 2, 0.98))',
      '--app-panel-gradient': 'linear-gradient(180deg, rgba(0, 22, 6, 0.94), rgba(0, 14, 3, 0.96))',
      '--app-overlay-gradient': 'linear-gradient(180deg, rgba(0, 12, 2, 0) 0%, rgba(0, 12, 2, 0.82) 100%)',
      '--app-input-bg': 'rgba(0, 10, 2, 0.78)',
      '--app-code-bg': 'rgba(0, 6, 1, 0.96)',
      '--app-table-stripe': 'rgba(0, 230, 65, 0.018)',
    },
  },
  light: {
    black: '#051209',
    white: '#f7fff9',
    cssVars: {
      '--app-bg': '#f0faf3',
      '--app-bg-soft': '#f8fdf9',
      '--app-header': 'rgba(247, 254, 249, 0.86)',
      '--app-sidebar': 'rgba(243, 252, 246, 0.97)',
      '--app-surface': 'rgba(255, 255, 255, 0.88)',
      '--app-surface-strong': 'rgba(255, 255, 255, 0.99)',
      '--app-surface-soft': 'rgba(239, 250, 242, 0.94)',
      '--app-text': '#061a0c',
      '--app-text-muted': 'rgba(6, 26, 12, 0.66)',
      '--app-text-soft': 'rgba(6, 26, 12, 0.44)',
      '--app-warning': '#c47d00',
      '--app-danger': '#cc2233',
      '--app-info': '#0077bb',
      '--app-card-shadow': '0 8px 22px rgba(5, 24, 11, 0.06)',
      '--app-card-shadow-lg': '0 14px 34px rgba(5, 24, 11, 0.09)',
      '--app-hero-gradient': 'linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(239, 250, 243, 0.96))',
      '--app-panel-gradient': 'linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(243, 251, 246, 0.97))',
      '--app-overlay-gradient': 'linear-gradient(180deg, rgba(240, 250, 243, 0) 0%, rgba(240, 250, 243, 0.92) 100%)',
      '--app-input-bg': 'rgba(250, 255, 252, 0.97)',
      '--app-code-bg': 'rgba(238, 250, 242, 0.96)',
      '--app-table-stripe': 'rgba(6, 26, 12, 0.024)',
    },
  },
};

const accentDefinitions: Record<PreferredTheme, Record<ThemeMode, AccentThemeDefinition>> = {
  green: {
    dark: {
      brand: [
        '#e0ffea',
        '#b3ffc8',
        '#7affa0',
        '#3dff74',
        '#18f552',
        '#00e641',
        '#00c436',
        '#009929',
        '#006e1d',
        '#003d0f',
      ],
      cssVars: {
        '--app-border': 'rgba(0, 230, 65, 0.18)',
        '--app-border-strong': 'rgba(0, 230, 65, 0.32)',
        '--app-accent': '#00e641',
        '--app-accent-strong': '#00c436',
        '--app-accent-contrast': '#000c02',
        '--app-secondary': '#39ff8a',
        '--app-success': '#00e641',
        '--app-grid':
          'linear-gradient(rgba(0, 230, 65, 0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 230, 65, 0.07) 1px, transparent 1px)',
        '--app-page-gradient':
          'radial-gradient(circle at top left, rgba(0, 196, 54, 0.12), transparent 30%), radial-gradient(circle at 85% 15%, rgba(57, 255, 138, 0.08), transparent 26%), linear-gradient(180deg, #000c02 0%, #010f03 50%, #000802 100%)',
        '--app-hover-fill': 'rgba(0, 230, 65, 0.09)',
        '--app-active-fill': 'rgba(0, 230, 65, 0.16)',
        '--app-badge-fill': 'rgba(0, 230, 65, 0.13)',
        '--app-hero-glow':
          'radial-gradient(circle at top right, rgba(0, 230, 65, 0.22), transparent 36%), radial-gradient(circle at bottom left, rgba(57, 255, 138, 0.1), transparent 30%)',
      },
    },
    light: {
      brand: [
        '#edfff3',
        '#d0fde3',
        '#a2f9c5',
        '#6beea2',
        '#3cde7e',
        '#1ec45e',
        '#149e4a',
        '#0e7a38',
        '#0a5628',
        '#063318',
      ],
      cssVars: {
        '--app-border': 'rgba(14, 122, 56, 0.13)',
        '--app-border-strong': 'rgba(14, 122, 56, 0.24)',
        '--app-accent': '#149e4a',
        '--app-accent-strong': '#0e7a38',
        '--app-accent-contrast': '#f7fff9',
        '--app-secondary': '#2a7d4f',
        '--app-success': '#149e4a',
        '--app-grid':
          'linear-gradient(rgba(20, 158, 74, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(20, 158, 74, 0.06) 1px, transparent 1px)',
        '--app-page-gradient':
          'radial-gradient(circle at top left, rgba(20, 158, 74, 0.1), transparent 28%), radial-gradient(circle at 82% 10%, rgba(42, 125, 79, 0.1), transparent 26%), linear-gradient(180deg, #f0faf3 0%, #f6fcf8 55%, #eaf5ee 100%)',
        '--app-hover-fill': 'rgba(20, 158, 74, 0.07)',
        '--app-active-fill': 'rgba(20, 158, 74, 0.13)',
        '--app-badge-fill': 'rgba(20, 158, 74, 0.1)',
        '--app-hero-glow':
          'radial-gradient(circle at top right, rgba(20, 158, 74, 0.13), transparent 36%), radial-gradient(circle at bottom left, rgba(42, 125, 79, 0.1), transparent 32%)',
      },
    },
  },
  blue: {
    dark: {
      brand: [
        '#edf5ff',
        '#d5e7ff',
        '#accfff',
        '#7ab0ff',
        '#5696ff',
        '#3b82f6',
        '#2563eb',
        '#1d4ed8',
        '#1b3faa',
        '#12246b',
      ],
      cssVars: {
        '--app-border': 'rgba(59, 130, 246, 0.2)',
        '--app-border-strong': 'rgba(59, 130, 246, 0.34)',
        '--app-accent': '#3b82f6',
        '--app-accent-strong': '#2563eb',
        '--app-accent-contrast': '#030d1c',
        '--app-secondary': '#7dd3fc',
        '--app-success': '#3b82f6',
        '--app-grid':
          'linear-gradient(rgba(59, 130, 246, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.08) 1px, transparent 1px)',
        '--app-page-gradient':
          'radial-gradient(circle at top left, rgba(37, 99, 235, 0.15), transparent 30%), radial-gradient(circle at 85% 15%, rgba(125, 211, 252, 0.08), transparent 26%), linear-gradient(180deg, #020912 0%, #04101d 52%, #00060d 100%)',
        '--app-hover-fill': 'rgba(59, 130, 246, 0.1)',
        '--app-active-fill': 'rgba(59, 130, 246, 0.18)',
        '--app-badge-fill': 'rgba(59, 130, 246, 0.13)',
        '--app-hero-glow':
          'radial-gradient(circle at top right, rgba(59, 130, 246, 0.22), transparent 36%), radial-gradient(circle at bottom left, rgba(125, 211, 252, 0.12), transparent 32%)',
      },
    },
    light: {
      brand: [
        '#eff6ff',
        '#dbeafe',
        '#bfdbfe',
        '#93c5fd',
        '#60a5fa',
        '#3b82f6',
        '#2563eb',
        '#1d4ed8',
        '#1e40af',
        '#172554',
      ],
      cssVars: {
        '--app-border': 'rgba(37, 99, 235, 0.14)',
        '--app-border-strong': 'rgba(37, 99, 235, 0.26)',
        '--app-accent': '#2563eb',
        '--app-accent-strong': '#1d4ed8',
        '--app-accent-contrast': '#f5f9ff',
        '--app-secondary': '#60a5fa',
        '--app-success': '#2563eb',
        '--app-grid':
          'linear-gradient(rgba(37, 99, 235, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(37, 99, 235, 0.06) 1px, transparent 1px)',
        '--app-page-gradient':
          'radial-gradient(circle at top left, rgba(37, 99, 235, 0.11), transparent 28%), radial-gradient(circle at 82% 10%, rgba(96, 165, 250, 0.12), transparent 26%), linear-gradient(180deg, #f3f8ff 0%, #f7fbff 55%, #edf4ff 100%)',
        '--app-hover-fill': 'rgba(37, 99, 235, 0.08)',
        '--app-active-fill': 'rgba(37, 99, 235, 0.14)',
        '--app-badge-fill': 'rgba(37, 99, 235, 0.1)',
        '--app-hero-glow':
          'radial-gradient(circle at top right, rgba(37, 99, 235, 0.13), transparent 36%), radial-gradient(circle at bottom left, rgba(96, 165, 250, 0.12), transparent 32%)',
      },
    },
  },
  purple: {
    dark: {
      brand: [
        '#f5efff',
        '#e4d5ff',
        '#cfb0ff',
        '#b58aff',
        '#9b70ff',
        '#8b5cf6',
        '#7c3aed',
        '#6d28d9',
        '#581caa',
        '#3b0764',
      ],
      cssVars: {
        '--app-border': 'rgba(139, 92, 246, 0.2)',
        '--app-border-strong': 'rgba(139, 92, 246, 0.34)',
        '--app-accent': '#8b5cf6',
        '--app-accent-strong': '#7c3aed',
        '--app-accent-contrast': '#13061f',
        '--app-secondary': '#c084fc',
        '--app-success': '#8b5cf6',
        '--app-grid':
          'linear-gradient(rgba(139, 92, 246, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.08) 1px, transparent 1px)',
        '--app-page-gradient':
          'radial-gradient(circle at top left, rgba(124, 58, 237, 0.15), transparent 30%), radial-gradient(circle at 85% 15%, rgba(192, 132, 252, 0.08), transparent 26%), linear-gradient(180deg, #09040f 0%, #13091c 52%, #05020a 100%)',
        '--app-hover-fill': 'rgba(139, 92, 246, 0.1)',
        '--app-active-fill': 'rgba(139, 92, 246, 0.18)',
        '--app-badge-fill': 'rgba(139, 92, 246, 0.13)',
        '--app-hero-glow':
          'radial-gradient(circle at top right, rgba(139, 92, 246, 0.22), transparent 36%), radial-gradient(circle at bottom left, rgba(192, 132, 252, 0.12), transparent 32%)',
      },
    },
    light: {
      brand: [
        '#faf5ff',
        '#f3e8ff',
        '#e9d5ff',
        '#d8b4fe',
        '#c084fc',
        '#a855f7',
        '#9333ea',
        '#7e22ce',
        '#6b21a8',
        '#4a044e',
      ],
      cssVars: {
        '--app-border': 'rgba(147, 51, 234, 0.15)',
        '--app-border-strong': 'rgba(147, 51, 234, 0.27)',
        '--app-accent': '#9333ea',
        '--app-accent-strong': '#7e22ce',
        '--app-accent-contrast': '#fcf7ff',
        '--app-secondary': '#c084fc',
        '--app-success': '#9333ea',
        '--app-grid':
          'linear-gradient(rgba(147, 51, 234, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(147, 51, 234, 0.06) 1px, transparent 1px)',
        '--app-page-gradient':
          'radial-gradient(circle at top left, rgba(147, 51, 234, 0.1), transparent 28%), radial-gradient(circle at 82% 10%, rgba(192, 132, 252, 0.12), transparent 26%), linear-gradient(180deg, #fbf7ff 0%, #fcf9ff 55%, #f4ecfb 100%)',
        '--app-hover-fill': 'rgba(147, 51, 234, 0.08)',
        '--app-active-fill': 'rgba(147, 51, 234, 0.14)',
        '--app-badge-fill': 'rgba(147, 51, 234, 0.1)',
        '--app-hero-glow':
          'radial-gradient(circle at top right, rgba(147, 51, 234, 0.12), transparent 36%), radial-gradient(circle at bottom left, rgba(192, 132, 252, 0.12), transparent 32%)',
      },
    },
  },
};

export function isPreferredTheme(value: string): value is PreferredTheme {
  return preferredThemes.includes(value as PreferredTheme);
}

function getThemeDefinition(mode: ThemeMode, preferredTheme: PreferredTheme): ThemeDefinition {
  const baseDefinition = baseDefinitions[mode];
  const accentDefinition = accentDefinitions[preferredTheme][mode];

  return {
    black: baseDefinition.black,
    white: baseDefinition.white,
    brand: accentDefinition.brand,
    cssVars: {
      ...baseDefinition.cssVars,
      ...accentDefinition.cssVars,
    },
  };
}

function createComponentTheme(mode: ThemeMode, preferredTheme: PreferredTheme) {
  const definition = getThemeDefinition(mode, preferredTheme);

  return createTheme({
    primaryColor: 'brand',
    primaryShade: {
      dark: 5,
      light: 6,
    },
    white: definition.white,
    black: definition.black,
    colors: {
      brand: definition.brand,
    },
    fontFamily: '"Share Tech Mono", "IBM Plex Mono", monospace',
    fontFamilyMonospace: '"Share Tech Mono", "Fira Code", monospace',
    headings: {
      fontFamily: '"Share Tech Mono", "Courier New", monospace',
      fontWeight: '700',
    },
    defaultRadius: 'xl',
    radius: {
      xs: '8px',
      sm: '12px',
      md: '16px',
      lg: '22px',
      xl: '28px',
    },
    defaultGradient: {
      from: 'brand.5',
      to: 'brand.3',
      deg: 135,
    },
    shadows: {
      xs: '0 3px 10px rgba(0, 12, 2, 0.06)',
      sm: 'var(--app-card-shadow)',
      md: 'var(--app-card-shadow)',
      lg: 'var(--app-card-shadow-lg)',
      xl: 'var(--app-card-shadow-lg)',
    },
    components: {
      AppShell: AppShell.extend({
        styles: {
          main: {
            background: 'transparent',
          },
          header: {
            background: 'var(--app-header)',
            backdropFilter: 'blur(22px)',
            borderColor: 'var(--app-border)',
          },
          navbar: {
            background: 'var(--app-sidebar)',
            borderColor: 'var(--app-border)',
            backdropFilter: 'blur(22px)',
          },
        },
      }),
      Paper: Paper.extend({
        defaultProps: {
          radius: 'xl',
          withBorder: true,
        },
        styles: {
          root: {
            background: 'var(--app-panel-gradient)',
            borderColor: 'var(--app-border)',
            boxShadow: 'var(--app-card-shadow)',
            backdropFilter: 'blur(18px)',
          },
        },
      }),
      Card: Card.extend({
        defaultProps: {
          radius: 'xl',
          withBorder: true,
          shadow: 'sm',
        },
        styles: {
          root: {
            background: 'var(--app-panel-gradient)',
            borderColor: 'var(--app-border)',
            boxShadow: 'var(--app-card-shadow)',
            backdropFilter: 'blur(18px)',
          },
        },
      }),
      Button: Button.extend({
        defaultProps: {
          radius: 'xl',
          fw: 700,
          size: 'md',
        },
        styles: {
          root: {
            letterSpacing: '0.04em',
            boxShadow: '0 4px 12px rgba(0, 12, 2, 0.1)',
            textTransform: 'uppercase',
          },
          label: {
            fontWeight: 700,
          },
        },
      }),
      ActionIcon: ActionIcon.extend({
        defaultProps: {
          radius: 'xl',
          variant: 'default',
        },
        styles: {
          root: {
            background: 'var(--app-surface-soft)',
            border: '1px solid var(--app-border)',
            color: 'var(--app-text)',
            boxShadow: 'none',
          },
        },
      }),
      Avatar: Avatar.extend({
        styles: {
          root: {
            border: '1px solid var(--app-border)',
            background: 'linear-gradient(145deg, var(--app-surface-strong), var(--app-surface))',
            color: 'var(--app-text)',
          },
        },
      }),
      Badge: Badge.extend({
        defaultProps: {
          radius: 'xl',
          variant: 'light',
        },
        styles: {
          root: {
            textTransform: 'uppercase',
            fontWeight: 700,
            letterSpacing: '0.06em',
            fontSize: '0.68rem',
          },
        },
      }),
      NavLink: NavLink.extend({
        defaultProps: {
          variant: 'filled',
        },
        styles: {
          root: {
            border: '1px solid transparent',
            borderRadius: '18px',
          },
          label: {
            fontWeight: 600,
            color: 'var(--app-text-muted)',
            letterSpacing: '0.02em',
          },
          section: {
            color: 'var(--app-text-soft)',
          },
        },
      }),
      Tabs: Tabs.extend({
        styles: {
          list: {
            gap: '0.5rem',
            padding: '0.25rem',
            borderRadius: '999px',
            background: 'var(--app-surface-soft)',
            border: '1px solid var(--app-border)',
          },
          tab: {
            borderRadius: '999px',
            color: 'var(--app-text-muted)',
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            fontSize: '0.75rem',
          },
        },
      }),
      Table: Table.extend({
        defaultProps: {
          highlightOnHover: true,
          verticalSpacing: 'md',
          horizontalSpacing: 'md',
        },
        styles: {
          table: {
            borderColor: 'var(--app-border)',
            overflow: 'hidden',
          },
          th: {
            background: 'var(--app-surface-soft)',
            color: 'var(--app-accent)',
            fontWeight: 700,
            borderColor: 'var(--app-border)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            fontSize: '0.72rem',
          },
          td: {
            borderColor: 'var(--app-border)',
          },
          tr: {
            borderColor: 'var(--app-border)',
          },
        },
      }),
      TextInput: TextInput.extend({
        defaultProps: {
          radius: 'xl',
          size: 'md',
        },
      }),
      Input: Input.extend({
        defaultProps: {
          radius: 'xl',
          size: 'md',
        },
        styles: {
          input: {
            background: 'var(--app-input-bg)',
            borderColor: 'var(--app-border)',
            color: 'var(--app-text)',
            backdropFilter: 'blur(14px)',
            letterSpacing: '0.02em',
          },
          section: {
            color: 'var(--app-text-soft)',
          },
        },
      }),
      Select: Select.extend({
        defaultProps: {
          radius: 'xl',
          size: 'md',
        },
        styles: {
          input: {
            background: 'var(--app-input-bg)',
            borderColor: 'var(--app-border)',
            color: 'var(--app-text)',
          },
          dropdown: {
            background: 'var(--app-surface-strong)',
            borderColor: 'var(--app-border)',
            boxShadow: 'var(--app-card-shadow)',
          },
        },
      }),
      Menu: Menu.extend({
        styles: {
          dropdown: {
            background: 'var(--app-surface-strong)',
            borderColor: 'var(--app-border)',
            boxShadow: 'var(--app-card-shadow)',
            backdropFilter: 'blur(18px)',
          },
          item: {
            borderRadius: '14px',
            letterSpacing: '0.02em',
          },
          label: {
            color: 'var(--app-text-soft)',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            fontSize: '0.68rem',
          },
        },
      }),
      Alert: Alert.extend({
        defaultProps: {
          radius: 'xl',
          variant: 'light',
        },
        styles: {
          root: {
            border: '1px solid var(--app-border)',
          },
          title: {
            fontWeight: 700,
            letterSpacing: '0.04em',
          },
        },
      }),
      Divider: Divider.extend({
        styles: {
          root: {
            borderColor: 'var(--app-border)',
          },
        },
      }),
      Chip: Chip.extend({
        defaultProps: {
          radius: 'xl',
        },
      }),
      Burger: Burger.extend({
        styles: {
          burger: {
            background: 'var(--app-text)',
          },
          root: {
            color: 'var(--app-text)',
          },
        },
      }),
      Modal: Modal.extend({
        styles: {
          content: {
            background: 'var(--app-surface-strong)',
            border: '1px solid var(--app-border)',
          },
          header: {
            background: 'transparent',
          },
          title: {
            fontWeight: 700,
            letterSpacing: '0.04em',
          },
        },
      }),
      Progress: Progress.extend({
        styles: {
          root: {
            background: 'var(--app-surface-soft)',
          },
        },
      }),
      RingProgress: RingProgress.extend({
        styles: {
          root: {
            filter: 'drop-shadow(0 2px 8px rgba(0, 12, 2, 0.12))',
          },
        },
      }),
    },
  });
}

export function getThemeCssVars(
  mode: ThemeMode,
  preferredTheme: PreferredTheme = 'green'
) {
  return getThemeDefinition(mode, preferredTheme).cssVars;
}

export function getMantineTheme(
  mode: ThemeMode,
  preferredTheme: PreferredTheme = 'green'
) {
  return createComponentTheme(mode, preferredTheme);
}
