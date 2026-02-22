
import type { FC } from 'react';
import { ActionIcon, Anchor, Burger, Button, Container, Group, HoverCard, Stack, Text, ThemeIcon, UnstyledButton } from '@mantine/core';
import { IconSunFilled, IconMoonFilled } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { type LandingNavLink } from './LandingLayout';
import { useTheme } from '../context/ThemeContext';


interface LandingHeaderProps {
    mobileOpened: boolean;
    setMobileOpened: (value: boolean) => void;
    links: LandingNavLink[];
}

export const LandingHeader: FC<LandingHeaderProps> = ({ mobileOpened, setMobileOpened, links }) => {
    const { colorScheme, toggleColorScheme } = useTheme();

    return (
        <Container size="lg" style={{ height: '100%' }}>
            <Group justify="space-between" align="center" h="100%">
                <Group gap="xs">
                    <ThemeIcon size={36} radius="xl" variant="gradient" gradient={{ from: 'cyan', to: 'green' }}>
                        CS
                    </ThemeIcon>
                    <Text fw={700}>CyberSentry</Text>
                </Group>

                <Group gap="lg" visibleFrom="sm">
                    {links.map((link) =>
                        link.children ? (
                            <HoverCard key={link.label} width={220} shadow="md" withArrow openDelay={100} closeDelay={200}>
                                <HoverCard.Target>
                                    <UnstyledButton fz="sm" c="dimmed" style={{ cursor: 'pointer' }}>
                                        {link.label}
                                    </UnstyledButton>
                                </HoverCard.Target>
                                <HoverCard.Dropdown>
                                    <Stack gap="xs">
                                        {link.children.map((child) => (
                                            <Anchor key={child.label} component={Link} to={child.href} fz="sm" c="dimmed">
                                                {child.label}
                                            </Anchor>
                                        ))}
                                    </Stack>
                                </HoverCard.Dropdown>
                            </HoverCard>
                        ) : (
                            <Anchor key={link.label} href={link.href} c="dimmed" fz="sm">
                                {link.label}
                            </Anchor>
                        )
                    )}
                    <ActionIcon
                        variant="subtle"
                        size="lg"
                        onClick={toggleColorScheme}
                        aria-label="Toggle color scheme"
                    >
                        { colorScheme === 'light' ? <IconMoonFilled></IconMoonFilled> : <IconSunFilled></IconSunFilled>}
                    </ActionIcon>
                    <Button component={Link} to="/login" variant="light">
                        Sign in
                    </Button>
                    <Button component={Link} to="/book-demo">
                        Get started
                    </Button>
                </Group>

                <Burger
                    opened={mobileOpened}
                    onClick={() => setMobileOpened(!mobileOpened)}
                    hiddenFrom="sm"
                    size="sm"
                    aria-label="Toggle navigation menu"
                />
            </Group>
        </Container>
    );
};