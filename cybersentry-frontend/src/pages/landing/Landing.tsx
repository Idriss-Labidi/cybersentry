import type { FC } from 'react';
import {
  Badge,
  Button,
  Card,
  Container,
  Grid,
  Group,
  List,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconArrowRight,
  IconBinaryTree2,
  IconBrandGithub,
  IconCheck,
  IconFingerprint,
  IconMailCheck,
  IconMapSearch,
  IconRadar2,
  IconShieldLock,
  IconTimeline,
  IconWorldSearch,
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { buildContactTarget, type ContactOfferId } from '../../data/contact-offers';

const featureCards = [
  {
    title: 'Unified signal',
    description: 'Correlate posture checks, DNS intelligence, email hygiene, and repository health in one interface.',
    icon: IconRadar2,
  },
  {
    title: 'Operator-focused UI',
    description: 'Readable results, compact layouts, and fast visual scanning instead of decorative dashboard noise.',
    icon: IconShieldLock,
  },
  {
    title: 'Actionable output',
    description: 'Every tool is designed to move from lookup to assessment to next step with minimal friction.',
    icon: IconTimeline,
  },
];

const toolCards = [
  { title: 'DNS Lookup', href: '/tools/dns-lookup', icon: IconWorldSearch, description: 'Query records quickly with focused output and typed responses.' },
  { title: 'DNS Propagation', href: '/tools/dns-propagation', icon: IconBinaryTree2, description: 'Trace record consistency across regions on an interactive map.' },
  { title: 'Email Security', href: '/tools/email-security', icon: IconMailCheck, description: 'Review SPF, DKIM, and DMARC posture with scoring and recommendations.' },
  { title: 'IP Reputation', href: '/tools/ip-reputation', icon: IconMapSearch, description: 'Assess risk, geolocation, network traits, and abuse indicators.' },
  { title: 'Typosquatting', href: '/tools/typosquatting', icon: IconFingerprint, description: 'Detect suspicious domain variants that may support phishing campaigns.' },
  { title: 'GitHub Health', href: '/login', icon: IconBrandGithub, description: 'Use the authenticated dashboard to inspect repository hygiene and exposure.' },
];

const planCards = [
  {
    name: 'Starter',
    offer: 'starter' as ContactOfferId,
    price: '$49 / month',
    points: ['Core public tools', 'Basic posture checks', 'Email support'],
    variant: 'light' as const,
  },
  {
    name: 'Growth',
    offer: 'growth' as ContactOfferId,
    price: '$149 / month',
    points: ['Shared dashboard workspace', 'Advanced GitHub and IP analysis', 'Investigation-ready reporting'],
    variant: 'filled' as const,
  },
  {
    name: 'Enterprise',
    offer: 'enterprise' as ContactOfferId,
    price: 'Custom',
    points: ['Private workflows', 'Priority support', 'Custom rollout and enablement'],
    variant: 'light' as const,
  },
];

export const Landing: FC = () => {
  return (
    <>
      <Container size="xl" className="landing-section">
        <Grid gutter="xl" align="center">
          <Grid.Col span={{ base: 12, lg: 6 }}>
            <Stack gap="xl">
              <div>
                <Text className="app-page-eyebrow">Live threat feed enabled</Text>
                <Title order={1} mt="lg" maw={620} style={{ fontSize: 'clamp(2.6rem, 5vw, 4.8rem)', letterSpacing: '-0.06em', lineHeight: 1 }}>
                  Security tooling that feels deliberate, not improvised.
                </Title>
                <Text mt="lg" size="lg" c="dimmed" maw={560}>
                  CyberSentry consolidates DNS, email, IP, and repository analysis into one cohesive surface so teams can move from lookup to decision without switching mental models.
                </Text>
              </div>

              <Group>
                <Button component={Link} to="/login" size="lg" rightSection={<IconArrowRight size={18} />}>
                  Open secure workspace
                </Button>
                <Button component="a" href="/#tools" size="lg" variant="light">
                  Explore tools
                </Button>
              </Group>

              <List
                spacing="md"
                icon={
                  <ThemeIcon size={26} radius="xl" color="brand" variant="light">
                    <IconCheck size={16} />
                  </ThemeIcon>
                }
              >
                <List.Item>Shared Mantine-first interface across public tools and authenticated workflows.</List.Item>
                <List.Item>Fast analysis surfaces for DNS, email, IP, and GitHub posture.</List.Item>
                <List.Item>Design tuned for visual scanning, not generic dashboard filler.</List.Item>
              </List>
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, lg: 6 }}>
            <Paper className="app-hero-card" p={{ base: 'lg', sm: 'xl' }} radius="xl">
              <Stack gap="lg">
                <Group justify="space-between">
                  <div>
                    <Text size="sm" c="dimmed">
                      Operations snapshot
                    </Text>
                    <Title order={3}>Command center overview</Title>
                  </div>
                  <Badge size="lg" color="brand">
                    Live
                  </Badge>
                </Group>

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  <Card p="lg">
                    <Text size="xs" tt="uppercase" fw={800} c="dimmed" style={{ letterSpacing: '0.08em' }}>
                      Active incidents
                    </Text>
                    <Title order={2} mt="xs">
                      12
                    </Title>
                    <Text c="dimmed" mt={4}>
                      Prioritized from recent DNS, email, and auth anomalies.
                    </Text>
                  </Card>
                  <Card p="lg">
                    <Text size="xs" tt="uppercase" fw={800} c="dimmed" style={{ letterSpacing: '0.08em' }}>
                      Coverage score
                    </Text>
                    <Title order={2} mt="xs">
                      94%
                    </Title>
                    <Text c="dimmed" mt={4}>
                      Verification across posture, routing, and monitoring controls.
                    </Text>
                  </Card>
                </SimpleGrid>

                <Paper p="lg" radius="xl" style={{ background: 'var(--app-surface-soft)' }}>
                  <Group justify="space-between" mb="md">
                    <Text fw={800}>Signal lanes</Text>
                    <Text size="sm" c="dimmed">
                      Last 24 hours
                    </Text>
                  </Group>
                  <Stack gap="sm">
                    {[
                      { label: 'Email posture drift', value: 'High confidence', tone: 'var(--app-warning)' },
                      { label: 'DNS resolver inconsistency', value: '5 regions impacted', tone: 'var(--app-info)' },
                      { label: 'Repository hygiene check', value: '2 repos need action', tone: 'var(--app-danger)' },
                    ].map((item) => (
                      <Group key={item.label} justify="space-between">
                        <Text>{item.label}</Text>
                        <Text fw={700} style={{ color: item.tone }}>
                          {item.value}
                        </Text>
                      </Group>
                    ))}
                  </Stack>
                </Paper>
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>
      </Container>

      <Container id="features" size="xl" className="landing-section">
        <Stack gap="lg" mb="xl">
          <Text className="app-page-eyebrow">Why teams choose it</Text>
          <Title order={2}>One product language across tools and workflows</Title>
          <Text c="dimmed" maw={620}>
            The public tools, protected dashboard, and analytical result views all share the same interaction model, visual rhythm, and technology stack.
          </Text>
        </Stack>

        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
          {featureCards.map((feature) => (
            <Card key={feature.title} p="xl">
              <ThemeIcon size={48} radius="xl" variant="light" color="brand">
                <feature.icon size={24} />
              </ThemeIcon>
              <Title order={4} mt="lg">
                {feature.title}
              </Title>
              <Text c="dimmed" mt="sm">
                {feature.description}
              </Text>
            </Card>
          ))}
        </SimpleGrid>
      </Container>

      <Container id="tools" size="xl" className="landing-section">
        <Stack gap="lg" mb="xl">
          <Text className="app-page-eyebrow">Tooling surface</Text>
          <Title order={2}>Start with the public analysis suite</Title>
          <Text c="dimmed" maw={620}>
            Each tool keeps the current dynamics and API-backed workflow, but now lives inside a more coherent design system.
          </Text>
        </Stack>

        <SimpleGrid cols={{ base: 1, md: 2, xl: 3 }} spacing="lg">
          {toolCards.map((tool) => (
            <Card
              key={tool.title}
              component={Link}
              to={tool.href}
              p="xl"
              style={{ textDecoration: 'none' }}
            >
              <Group justify="space-between" align="flex-start">
                <ThemeIcon size={52} radius="xl" variant="light" color="brand">
                  <tool.icon size={26} />
                </ThemeIcon>
                <Badge color="brand">{tool.href === '/login' ? 'Authenticated' : 'Public'}</Badge>
              </Group>
              <Title order={4} mt="lg">
                {tool.title}
              </Title>
              <Text c="dimmed" mt="sm">
                {tool.description}
              </Text>
              <Group mt="lg" gap="xs">
                <Text fw={700}>Open tool</Text>
                <IconArrowRight size={16} />
              </Group>
            </Card>
          ))}
        </SimpleGrid>
      </Container>

      <Container id="pricing" size="xl" className="landing-section">
        <Stack gap="lg" mb="xl">
          <Text className="app-page-eyebrow">Pricing</Text>
          <Title order={2}>Scale access as the investigation surface expands</Title>
        </Stack>

        <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="lg">
          {planCards.map((plan) => (
            <Card
              key={plan.name}
              p="xl"
              style={{
                background:
                  plan.variant === 'filled'
                    ? 'linear-gradient(145deg, rgba(22, 193, 160, 0.18), var(--app-panel-gradient))'
                    : 'linear-gradient(180deg, var(--app-surface-strong), var(--app-surface-soft))',
                borderColor:
                  plan.variant === 'filled'
                    ? 'var(--app-border-strong)'
                    : 'rgba(255, 255, 255, 0.08)',
              }}
            >
              <Text className="app-page-eyebrow">{plan.name}</Text>
              <Title order={3} mt="lg">
                {plan.price}
              </Title>
              <List
                mt="lg"
                spacing="sm"
                icon={
                  <ThemeIcon size={22} radius="xl" variant="light" color="brand">
                    <IconCheck size={14} />
                  </ThemeIcon>
                }
              >
                {plan.points.map((point) => (
                  <List.Item key={point}>{point}</List.Item>
                ))}
              </List>
              <Button
                component={Link}
                to={buildContactTarget(plan.offer, `pricing-${plan.name.toLowerCase()}`)}
                state={{ offer: plan.offer, source: `pricing-${plan.name.toLowerCase()}` }}
                mt="xl"
                fullWidth
                variant={plan.variant === 'filled' ? 'filled' : 'light'}
              >
                {plan.name === 'Enterprise' ? 'Talk to us' : `Choose ${plan.name}`}
              </Button>
            </Card>
          ))}
        </SimpleGrid>
      </Container>

      <Container id="about" size="xl" className="landing-section">
        <Grid gutter="xl" align="center">
          <Grid.Col span={{ base: 12, lg: 6 }}>
            <Stack gap="lg">
              <Text className="app-page-eyebrow">About the platform</Text>
              <Title order={2}>Built for modern response teams that need clarity under pressure</Title>
              <Text c="dimmed">
                CyberSentry is structured around repeatable analysis tasks: investigate, compare, score, and act. The redesign keeps the existing workflows but makes the system feel more deliberate and cohesive.
              </Text>
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, lg: 6 }}>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
              {[
                ['Fast read', 'Hierarchy, spacing, and contrast tuned for dense analytical output.'],
                ['Consistent UI', 'Shared shells and tokens reduce visual drift across pages.'],
                ['Mantine-native', 'No mixed design stack or parallel styling system.'],
                ['Operational focus', 'The UI supports investigations instead of distracting from them.'],
              ].map(([title, body]) => (
                <Paper key={title} p="lg" radius="xl">
                  <Text fw={800}>{title}</Text>
                  <Text c="dimmed" mt="sm">
                    {body}
                  </Text>
                </Paper>
              ))}
            </SimpleGrid>
          </Grid.Col>
        </Grid>
      </Container>

      <Container id="contact" size="xl" className="landing-section">
        <Paper className="app-hero-card" p={{ base: 'lg', sm: 'xl' }} radius="xl">
          <Group justify="space-between" align="center">
            <div>
              <Text className="app-page-eyebrow">Contact</Text>
              <Title order={2} mt="lg">
                Ready to review your attack surface in one place?
              </Title>
              <Text c="dimmed" mt="sm" maw={620}>
                Walk through the current tools, the protected dashboard, and the redesigned theme system with your own priorities and workflows in mind.
              </Text>
            </div>
              <Group>
                <Button component={Link} to="/login">
                Sign in
              </Button>
                <Button
                  component={Link}
                  to={buildContactTarget('general', 'landing-contact-section')}
                  state={{ offer: 'general', source: 'landing-contact-section' }}
                  variant="light"
                >
                  Contact team
              </Button>
            </Group>
          </Group>
        </Paper>
      </Container>
    </>
  );
};
