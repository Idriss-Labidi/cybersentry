import type { FC } from 'react';
import { Anchor, Container, Group, Text } from '@mantine/core';

export const LandingFooter: FC = () => {
	const year = new Date().getFullYear();

	return (
		<Container size="lg" py="md">
			<Group justify="space-between" align="center">
				<Group gap="xs">
					<Text fw={700}>CyberSentry</Text>
					<Text c="dimmed" fz="sm">
						Modern security insights for your stack.
					</Text>
				</Group>

				<Group gap="lg" c="dimmed" fz="sm">
					<Anchor href="#about" c="dimmed">
						About
					</Anchor>
					<Anchor href="#pricing" c="dimmed">
						Pricing
					</Anchor>
					<Anchor href="#contact" c="dimmed">
						Contact
					</Anchor>
				</Group>
			</Group>

			<Text c="dimmed" fz="xs" mt="sm">
				© {year} CyberSentry. All rights reserved.
			</Text>
		</Container>
	);
};
