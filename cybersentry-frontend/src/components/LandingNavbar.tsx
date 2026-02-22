import {type FC} from "react"
import { type LandingNavLink } from "./LandingLayout";
import { ActionIcon, Button, Divider, Group, NavLink, ScrollArea, Stack } from "@mantine/core";
import { IconMoonFilled, IconSunFilled } from "@tabler/icons-react";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

const LandingNavbar: FC<{ links : LandingNavLink[]}> = ({ links }) => {
    const { colorScheme, toggleColorScheme } = useTheme();

    return ( 
        <ScrollArea p="md">
            <Stack>
                { links.map( link => 
                    link.children ? (
                        <NavLink key={link.label} label={link.label}>
                            {link.children.map(child => (
                                <NavLink
                                    key={child.label}
                                    component={Link}
                                    to={child.href}
                                    label={child.label}
                                />
                            ))}
                        </NavLink>
                    ) : (
                        <NavLink
                            key={link.label}
                            component={Link}
                            to={link.href}
                            label={link.label}
                        />
                    )
                )}
                <Divider my="xs" />
                <Group justify="space-between" px="sm">
                    <ActionIcon
                        variant="subtle"
                        size="lg"
                        onClick={toggleColorScheme}
                        aria-label="Toggle color scheme"
                    >
                        { colorScheme === 'light' ? <IconMoonFilled></IconMoonFilled> : <IconSunFilled></IconSunFilled>}
                    </ActionIcon>
                    <Group gap="xs">
                        <Button component={Link} to="/login" variant="light" size="xs">
                            Sign in
                        </Button>
                        <Button component={Link} to="/book-demo" size="xs">
                            Get started
                        </Button>
                    </Group>
                </Group>
            </Stack>
        </ScrollArea>
    );
}

export default LandingNavbar;