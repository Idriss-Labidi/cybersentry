import {
    Button,
    Card,
    Container,
    Grid,
    List,
    Text,
    ThemeIcon,
    Title,
    Badge,
    SimpleGrid,
    Divider,
    Group,
} from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import type { FC } from 'react';

export const Landing: FC = () => {
    return (
        <>
            <Container size="lg" py="xl">
                <Grid gutter="xl" align="center">
                    <Grid.Col span={{ base: 12, md: 6 }}>
                        <Badge size="lg" variant="gradient" gradient={{ from: 'cyan', to: 'green' }}>
                            New: Live threat feed
                        </Badge>
                        <Title order={1} mt="md">
                            Security visibility that teams actually use
                        </Title>
                        <Text mt="sm" c="dimmed">
                            CyberSentry unifies alerts, analytics, and posture checks in one fast interface. Stay ahead of incidents
                            with prioritized insights and collaborative workflows.
                        </Text>
                        <Group mt="xl" gap="md">
                            <Button size="md">
                                Start free
                            </Button>
                            <Button size="md" variant="light">
                                Book a demo
                            </Button>
                        </Group>
                        <List
                            mt="xl"
                            spacing="md"
                            icon={
                                <ThemeIcon size={24} radius="xl">
                                    <IconCheck size={16} />
                                </ThemeIcon>
                            }
                        >
                            <List.Item>Unified alert stream with smart grouping</List.Item>
                            <List.Item>Analytics built for SOC and engineering teams</List.Item>
                            <List.Item>Granular RBAC and audit-ready reporting</List.Item>
                        </List>
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, md: 6 }}>
                        <Card shadow="sm" padding="lg" radius="md" withBorder>
                            <Title order={3}>Operational overview</Title>
                            <Text c="dimmed" fz="sm" mt="xs">
                                Snapshot of your environment health, attack surface, and open investigations.
                            </Text>
                            <SimpleGrid cols={{ base: 1, sm: 2 }} mt="lg" spacing="md">
                                <Card shadow="xs" padding="md" radius="md" withBorder>
                                    <Text c="dimmed" fz="sm">
                                        Active incidents
                                    </Text>
                                    <Title order={2}>12</Title>
                                    <Text c="green" fz="sm">
                                        -18% vs last week
                                    </Text>
                                </Card>
                                <Card shadow="xs" padding="md" radius="md" withBorder>
                                    <Text c="dimmed" fz="sm">
                                        Coverage score
                                    </Text>
                                    <Title order={2}>92%</Title>
                                    <Text c="dimmed" fz="sm">
                                        Controls verified
                                    </Text>
                                </Card>
                                <Card shadow="xs" padding="md" radius="md" withBorder>
                                    <Text c="dimmed" fz="sm">
                                        Mean response
                                    </Text>
                                    <Title order={2}>7m</Title>
                                    <Text c="dimmed" fz="sm">
                                        24/7 coverage
                                    </Text>
                                </Card>
                                <Card shadow="xs" padding="md" radius="md" withBorder>
                                    <Text c="dimmed" fz="sm">
                                        Integrations
                                    </Text>
                                    <Title order={2}>30+</Title>
                                    <Text c="dimmed" fz="sm">
                                        Clouds, SIEM, EDR
                                    </Text>
                                </Card>
                            </SimpleGrid>
                        </Card>
                    </Grid.Col>
                </Grid>
            </Container>

            <Divider id="features" my="xl" />

            <Container size="lg" py="xl">
                <Title order={2}>Why teams choose CyberSentry</Title>
                <Text c="dimmed" mt="xs">
                    Fast setup, deep visibility, and automation ready out of the box.
                </Text>
                <SimpleGrid cols={{ base: 1, md: 3 }} mt="lg" spacing="lg">
                    <Card withBorder shadow="sm" padding="lg">
                        <Title order={4}>Unified signal</Title>
                        <Text c="dimmed" mt="sm">
                            Bring SIEM, cloud, and endpoint telemetry together with consistent triage and routing.
                        </Text>
                    </Card>
                    <Card withBorder shadow="sm" padding="lg">
                        <Title order={4}>Actionable analytics</Title>
                        <Text c="dimmed" mt="sm">
                            Prebuilt dashboards for posture, incident trends, and compliance-readiness.
                        </Text>
                    </Card>
                    <Card withBorder shadow="sm" padding="lg">
                        <Title order={4}>Collaboration-first</Title>
                        <Text c="dimmed" mt="sm">
                            Assign owners, track timelines, and keep stakeholders informed with clean audit trails.
                        </Text>
                    </Card>
                </SimpleGrid>
            </Container>

            <Divider id="pricing" my="xl" />

            <Container size="lg" py="xl">
                <Title order={2}>Plans that scale with you</Title>
                <Text c="dimmed" mt="xs">
                    Simple pricing for modern security teams.
                </Text>
                <SimpleGrid cols={{ base: 1, md: 3 }} mt="lg" spacing="lg">
                    <Card withBorder padding="lg" shadow="sm">
                        <Title order={4}>Starter</Title>
                        <Text mt="xs">$49 / month</Text>
                        <List
                            mt="md"
                            spacing="sm"
                            icon={
                                <ThemeIcon size={20} radius="xl">
                                    <IconCheck size={14} />
                                </ThemeIcon>
                            }
                        >
                            <List.Item>Unified alerting</List.Item>
                            <List.Item>5 team members</List.Item>
                            <List.Item>Email support</List.Item>
                        </List>
                        <Button fullWidth mt="lg" variant="light" >
                            Choose Starter
                        </Button>
                    </Card>

                    <Card withBorder padding="lg" shadow="md">
                        <Title order={4}>Growth</Title>
                        <Text mt="xs">$149 / month</Text>
                        <List
                            mt="md"
                            spacing="sm"
                            icon={
                                <ThemeIcon size={20} radius="xl">
                                    <IconCheck size={14} />
                                </ThemeIcon>
                            }
                        >
                            <List.Item>Advanced analytics</List.Item>
                            <List.Item>Unlimited investigations</List.Item>
                            <List.Item>Role-based access</List.Item>
                        </List>
                        <Button fullWidth mt="lg">
                            Choose Growth
                        </Button>
                    </Card>

                    <Card withBorder padding="lg" shadow="sm">
                        <Title order={4}>Enterprise</Title>
                        <Text mt="xs">Let&apos;s talk</Text>
                        <List
                            mt="md"
                            spacing="sm"
                            icon={
                                <ThemeIcon size={20} radius="xl">
                                    <IconCheck size={14} />
                                </ThemeIcon>
                            }
                        >
                            <List.Item>Custom integrations</List.Item>
                            <List.Item>24/7 support and SLAs</List.Item>
                            <List.Item>Dedicated CSM</List.Item>
                        </List>
                        <Button fullWidth mt="lg" variant="light">
                            Talk to sales
                        </Button>
                    </Card>
                </SimpleGrid>
            </Container>

            <Divider id="about" my="xl" />

            <Container size="lg" py="xl">
                <Grid gutter="xl" align="center">
                    <Grid.Col span={{ base: 12, md: 6 }}>
                        <Title order={2}>Built for modern incident response</Title>
                        <Text c="dimmed" mt="sm">
                            CyberSentry is crafted by operators and engineers who have run global detection and response programs. We
                            prioritize clarity, speed, and automation so you can focus on impact.
                        </Text>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                        <Card withBorder shadow="sm" padding="lg">
                            <Title order={4}>What we believe</Title>
                            <List
                                mt="md"
                                spacing="sm"
                                icon={
                                    <ThemeIcon size={20} radius="xl">
                                        <IconCheck size={14} />
                                    </ThemeIcon>
                                }
                            >
                                <List.Item>Security tools should be fast and intuitive.</List.Item>
                                <List.Item>Signals must be ranked by risk, not noise.</List.Item>
                                <List.Item>Collaboration is core to every investigation.</List.Item>
                            </List>
                        </Card>
                    </Grid.Col>
                </Grid>
            </Container>

            <Divider id="contact" my="xl" />

            <Container size="lg" py="xl">
                <Card withBorder shadow="md" padding="xl" radius="md">
                    <Title order={2}>Ready to see CyberSentry?</Title>
                    <Text c="dimmed" mt="sm">
                        Talk with our team or jump into the product. We will tailor a walkthrough to your stack and priorities.
                    </Text>
                    <Group mt="lg" gap="md">
                        <Button>Book time</Button>
                        <Button variant="light">Explore docs</Button>
                    </Group>
                </Card>
            </Container>
        </>
    );
};