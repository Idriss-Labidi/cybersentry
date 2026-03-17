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

type ThemeDefinition = {
  brand: BrandPalette;
  black: string;
  white: string;
  cssVars: Record<`--${string}`, string>;
};

// Dark: Classic phosphor-green terminal on near-black
const darkTheme: ThemeDefinition = {
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
    '--app-border': 'rgba(0, 230, 65, 0.18)',
    '--app-border-strong': 'rgba(0, 230, 65, 0.32)',
    '--app-text': '#e0ffe8',
    '--app-text-muted': 'rgba(224, 255, 232, 0.68)',
    '--app-text-soft': 'rgba(224, 255, 232, 0.42)',
    '--app-accent': '#00e641',
    '--app-accent-strong': '#00c436',
    '--app-accent-contrast': '#000c02',
    '--app-secondary': '#39ff8a',
    '--app-warning': '#ffe033',
    '--app-danger': '#ff3344',
    '--app-success': '#00e641',
    '--app-info': '#00d4ff',
    '--app-card-shadow': '0 20px 60px rgba(0, 0, 0, 0.6)',
    '--app-card-shadow-lg': '0 32px 96px rgba(0, 0, 0, 0.72)',
    '--app-grid': 'linear-gradient(rgba(0, 230, 65, 0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 230, 65, 0.07) 1px, transparent 1px)',
    '--app-page-gradient': 'radial-gradient(circle at top left, rgba(0, 196, 54, 0.12), transparent 30%), radial-gradient(circle at 85% 15%, rgba(57, 255, 138, 0.08), transparent 26%), linear-gradient(180deg, #000c02 0%, #010f03 50%, #000802 100%)',
    '--app-hero-gradient': 'linear-gradient(140deg, rgba(0, 20, 6, 0.96), rgba(0, 12, 2, 0.98))',
    '--app-panel-gradient': 'linear-gradient(180deg, rgba(0, 22, 6, 0.94), rgba(0, 14, 3, 0.96))',
    '--app-overlay-gradient': 'linear-gradient(180deg, rgba(0, 12, 2, 0) 0%, rgba(0, 12, 2, 0.82) 100%)',
    '--app-hover-fill': 'rgba(0, 230, 65, 0.09)',
    '--app-active-fill': 'rgba(0, 230, 65, 0.16)',
    '--app-input-bg': 'rgba(0, 10, 2, 0.78)',
    '--app-code-bg': 'rgba(0, 6, 1, 0.96)',
    '--app-table-stripe': 'rgba(0, 230, 65, 0.018)',
    '--app-badge-fill': 'rgba(0, 230, 65, 0.13)',
    '--app-hero-glow': 'radial-gradient(circle at top right, rgba(0, 230, 65, 0.22), transparent 36%), radial-gradient(circle at bottom left, rgba(57, 255, 138, 0.1), transparent 30%)',
  },
};

// Light: Bleached terminal printout — ivory paper, deep-ink greens
const lightTheme: ThemeDefinition = {
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
    '--app-border': 'rgba(14, 122, 56, 0.13)',
    '--app-border-strong': 'rgba(14, 122, 56, 0.24)',
    '--app-text': '#061a0c',
    '--app-text-muted': 'rgba(6, 26, 12, 0.66)',
    '--app-text-soft': 'rgba(6, 26, 12, 0.44)',
    '--app-accent': '#149e4a',
    '--app-accent-strong': '#0e7a38',
    '--app-accent-contrast': '#f7fff9',
    '--app-secondary': '#2a7d4f',
    '--app-warning': '#c47d00',
    '--app-danger': '#cc2233',
    '--app-success': '#149e4a',
    '--app-info': '#0077bb',
    '--app-card-shadow': '0 16px 44px rgba(5, 24, 11, 0.08)',
    '--app-card-shadow-lg': '0 28px 70px rgba(5, 24, 11, 0.13)',
    '--app-grid': 'linear-gradient(rgba(20, 158, 74, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(20, 158, 74, 0.06) 1px, transparent 1px)',
    '--app-page-gradient': 'radial-gradient(circle at top left, rgba(20, 158, 74, 0.1), transparent 28%), radial-gradient(circle at 82% 10%, rgba(42, 125, 79, 0.1), transparent 26%), linear-gradient(180deg, #f0faf3 0%, #f6fcf8 55%, #eaf5ee 100%)',
    '--app-hero-gradient': 'linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(239, 250, 243, 0.96))',
    '--app-panel-gradient': 'linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(243, 251, 246, 0.97))',
    '--app-overlay-gradient': 'linear-gradient(180deg, rgba(240, 250, 243, 0) 0%, rgba(240, 250, 243, 0.92) 100%)',
    '--app-hover-fill': 'rgba(20, 158, 74, 0.07)',
    '--app-active-fill': 'rgba(20, 158, 74, 0.13)',
    '--app-input-bg': 'rgba(250, 255, 252, 0.97)',
    '--app-code-bg': 'rgba(238, 250, 242, 0.96)',
    '--app-table-stripe': 'rgba(6, 26, 12, 0.024)',
    '--app-badge-fill': 'rgba(20, 158, 74, 0.1)',
    '--app-hero-glow': 'radial-gradient(circle at top right, rgba(20, 158, 74, 0.13), transparent 36%), radial-gradient(circle at bottom left, rgba(42, 125, 79, 0.1), transparent 32%)',
  },
};

const definitions: Record<ThemeMode, ThemeDefinition> = {
  dark: darkTheme,
  light: lightTheme,
};

function createComponentTheme(mode: ThemeMode) {
  const definition = definitions[mode];

  return createTheme({
    primaryColor: 'brand',
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
      xs: '0 8px 18px rgba(0, 12, 2, 0.08)',
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
            boxShadow: '0 12px 28px rgba(0, 12, 2, 0.18)',
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
            filter: 'drop-shadow(0 6px 16px rgba(0, 12, 2, 0.22))',
          },
        },
      }),
    },
  });
}

export function getThemeCssVars(mode: ThemeMode) {
  return definitions[mode].cssVars;
}

export function getMantineTheme(mode: ThemeMode) {
  return createComponentTheme(mode);
}