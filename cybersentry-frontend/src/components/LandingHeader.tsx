
import type { FC } from 'react';
import { Anchor, Burger, Button, Container, Group, Text, ThemeIcon } from '@mantine/core';
import { Link } from 'react-router-dom';
import { type LandingNavLink } from './LandingLayout';


interface LandingHeaderProps {
    mobileOpened: boolean;
    setMobileOpened: (value: boolean) => void;
    links: LandingNavLink[];
}

export const LandingHeader: FC<LandingHeaderProps> = ({ mobileOpened, setMobileOpened, links }) => {
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
                    {links.map((link) => (
                        <Anchor key={link.label} href={link.href} c="dimmed" fz="sm">
                            {link.label}
                        </Anchor>
                    ))}
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