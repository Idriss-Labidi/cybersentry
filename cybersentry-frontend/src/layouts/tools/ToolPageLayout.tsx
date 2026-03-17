import type { ReactNode } from 'react';
import {
  Badge,
  Container,
  Divider,
  Grid,
  Group,
  Paper,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core';
import type { HeroMetric } from '../../components/PageHero';
import PageHero from '../../components/PageHero';

type ToolPageLayoutProps = {
  icon: ReactNode;
  eyebrow?: string;
  title: string;
  description: string;
  metrics?: HeroMetric[];
  workflow?: string[];
  notes?: string[];
  examples?: string[];
  children: ReactNode;
  actions?: ReactNode;
  mainSpan?: number;
};

function SidePanel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Paper p="lg" radius="xl">
      <Text fw={800}>{title}</Text>
      {description ? (
        <Text size="sm" c="dimmed" mt={4}>
          {description}
        </Text>
      ) : null}
      <Divider my="md" />
      {children}
    </Paper>
  );
}

export default function ToolPageLayout({
  icon,
  eyebrow,
  title,
  description,
  metrics = [],
  workflow = [],
  notes = [],
  examples = [],
  children,
  actions,
  mainSpan = 8,
}: ToolPageLayoutProps) {
  const showAside = workflow.length > 0 || notes.length > 0 || examples.length > 0;

  return (
    <Container size="xl" py="xl" className="app-page">
      <Stack gap="xl">
        <PageHero
          icon={icon}
          eyebrow={eyebrow}
          title={title}
          description={description}
          metrics={metrics}
          actions={actions}
        />

        <Grid gutter="lg" align="flex-start">
          <Grid.Col span={{ base: 12, lg: showAside ? mainSpan : 12 }}>
            <Stack gap="lg">{children}</Stack>
          </Grid.Col>

          {showAside ? (
            <Grid.Col span={{ base: 12, lg: 12 - mainSpan }}>
              <Stack gap="lg" className="tool-shell-nav">
                {workflow.length > 0 ? (
                  <SidePanel
                    title="Operational flow"
                    description="Use this sequence to keep the output clean and actionable."
                  >
                    <Stack gap="sm">
                      {workflow.map((step, index) => (
                        <Group key={step} wrap="nowrap" align="flex-start">
                          <ThemeIcon size={28} radius="xl" variant="light" color="brand">
                            <Text size="xs" fw={800}>
                              {index + 1}
                            </Text>
                          </ThemeIcon>
                          <Text size="sm">{step}</Text>
                        </Group>
                      ))}
                    </Stack>
                  </SidePanel>
                ) : null}

                {notes.length > 0 ? (
                  <SidePanel title="Analyst notes">
                    <Stack gap="sm">
                      {notes.map((note) => (
                        <Group key={note} wrap="nowrap" align="flex-start">
                          <div
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 999,
                              marginTop: 7,
                              background: 'var(--app-accent)',
                              flexShrink: 0,
                            }}
                          />
                          <Text size="sm" c="dimmed">
                            {note}
                          </Text>
                        </Group>
                      ))}
                    </Stack>
                  </SidePanel>
                ) : null}

                {examples.length > 0 ? (
                  <SidePanel
                    title="Quick inputs"
                    description="Useful values for smoke testing and demos."
                  >
                    <Stack gap="xs">
                      {examples.map((example) => (
                        <Badge
                          key={example}
                          size="lg"
                          variant="light"
                          color="brand"
                          styles={{ root: { justifyContent: 'flex-start', textTransform: 'none' } }}
                        >
                          {example}
                        </Badge>
                      ))}
                    </Stack>
                  </SidePanel>
                ) : null}
              </Stack>
            </Grid.Col>
          ) : null}
        </Grid>
      </Stack>
    </Container>
  );
}
