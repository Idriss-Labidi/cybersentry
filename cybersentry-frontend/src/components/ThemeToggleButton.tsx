import { ActionIcon, Tooltip } from '@mantine/core';
import { IconMoonFilled, IconSunFilled } from '@tabler/icons-react';
import { useTheme } from '../context/theme/useTheme';

export default function ThemeToggleButton() {
  const { colorScheme, toggleColorScheme } = useTheme();
  const isLight = colorScheme === 'light';

  return (
    <Tooltip label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}>
      <ActionIcon
        onClick={toggleColorScheme}
        size="lg"
        variant="default"
        aria-label="Toggle color scheme"
      >
        {isLight ? <IconMoonFilled size={18} /> : <IconSunFilled size={18} />}
      </ActionIcon>
    </Tooltip>
  );
}
