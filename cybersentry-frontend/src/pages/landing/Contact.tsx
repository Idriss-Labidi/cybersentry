import { useState, type FormEvent } from 'react';
import {
  Anchor,
  Badge,
  Button,
  Card,
  Container,
  Grid,
  Group,
  List,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Textarea,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconBuilding,
  IconCheck,
  IconMail,
  IconMessageDots,
  IconSend,
  IconUser,
} from '@tabler/icons-react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import {
  buildContactTarget,
  contactOfferOptions,
  type ContactOfferId,
  resolveContactOffer,
} from '../../data/contact-offers';
import { notifySuccess } from '../../utils/ui-notify';

type ContactLocationState = {
  offer?: string;
  source?: string;
};

type ContactFormState = {
  offer: ContactOfferId;
  organization: string;
  personalName: string;
  role: string;
  email: string;
  phone: string;
  message: string;
};

const initialFormState = (offer: ContactOfferId): ContactFormState => ({
  offer,
  organization: '',
  personalName: '',
  role: '',
  email: '',
  phone: '',
  message: '',
});

type ContactContentProps = {
  initialOffer: ContactOfferId;
  source: string;
};

const ContactContent = ({ initialOffer/*, source*/ }: ContactContentProps) => {
  const [form, setForm] = useState<ContactFormState>(() => initialFormState(initialOffer));

  const selectedOffer =
    contactOfferOptions.find((option) => option.value === form.offer) ?? contactOfferOptions[0];

  const canSubmit =
    form.message.trim().length >= 12 &&
    form.email.trim().length > 0 &&
    (form.organization.trim().length > 0 || form.personalName.trim().length > 0);

  const updateField = <K extends keyof ContactFormState>(field: K, value: ContactFormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    /*const subject = `CyberSentry contact request - ${selectedOffer.label}`;
    const body = [
      `Offer: ${selectedOffer.label}`,
      `Source: ${source}`,
      `Organisation: ${form.organization || 'Not provided'}`,
      `Personal name: ${form.personalName || 'Not provided'}`,
      `Role: ${form.role || 'Not provided'}`,
      `Email: ${form.email}`,
      `Phone: ${form.phone || 'Not provided'}`,
      '',
      form.message,
    ].join('\n');*/

    //window.location.href = `mailto:sales@cybersentry.local?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    notifySuccess('Request Sent', 'Your contact request has been sent. We will get back to you shortly.');
  };

  return (
    <Container size="xl" className="landing-section">
      <Grid gutter="xl" align="stretch">
        <Grid.Col span={{ base: 12, lg: 5 }}>
          <Stack gap="lg">
            <div>
              <Text className="app-page-eyebrow">Contact</Text>
              <Title order={1} mt="lg" style={{ fontSize: 'clamp(2.3rem, 4vw, 4rem)', letterSpacing: '-0.05em', lineHeight: 1.04 }}>
                Ask for the right plan, not just a generic callback.
              </Title>
              <Text c="dimmed" mt="lg" maw={540}>
                The offer is preselected from the landing page CTA you used, but you can change it anytime before sending the message.
              </Text>
            </div>

            <Paper className="app-surface-soft" p="lg" radius="xl" withBorder>
              <Group justify="space-between" align="flex-start" mb="md">
                {/*<div>
                  <Text size="sm" c="dimmed">
                    Current source
                  </Text>
                  <Title order={3} mt={4}>
                    {source}
                  </Title>
                </div>*/}
                <Badge color="brand" variant="light">
                  {selectedOffer.value}
                </Badge>
              </Group>

              <Text fw={800}>{selectedOffer.label}</Text>
              <Text c="dimmed" mt="xs">
                {selectedOffer.description}
              </Text>

              <List
                mt="lg"
                spacing="sm"
                icon={
                  <ThemeIcon size={22} radius="xl" variant="light" color="brand">
                    <IconCheck size={14} />
                  </ThemeIcon>
                }
              >
                <List.Item>Preselected automatically from the CTA you clicked.</List.Item>
                <List.Item>Change the plan if your request spans multiple needs.</List.Item>
                <List.Item>Use the free message to describe scope, timing, or licensing details.</List.Item>
              </List>

              <Group align="flex-start" gap="sm" mt="lg">
                <ThemeIcon size={28} radius="lg" variant="light" color="brand">
                  <IconMessageDots size={16} />
                </ThemeIcon>
                <Text size="sm" c="dimmed">
                  The free message can include procurement notes, technical constraints, or the context behind your request.
                </Text>
              </Group>
            </Paper>

            <Card p="lg" radius="xl" className="app-hero-card">
              <Stack gap="md">
                <Group>
                  <ThemeIcon size={46} radius="xl" variant="light" color="brand">
                    <IconMail size={22} />
                  </ThemeIcon>
                  <div>
                    <Text fw={800}>What happens next</Text>
                    <Text size="sm" c="dimmed">
                      A request draft is prepared for your mail client.
                    </Text>
                  </div>
                </Group>

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                  <Paper p="md" radius="lg" style={{ background: 'var(--app-surface-soft)' }}>
                    <Group align="flex-start" gap="sm">
                      <ThemeIcon size={32} radius="lg" variant="light" color="brand">
                        <IconBuilding size={18} />
                      </ThemeIcon>
                      <div>
                        <Text fw={700}>Organisation context</Text>
                        <Text size="sm" c="dimmed">
                          Helps route the request to the right licensing path.
                        </Text>
                      </div>
                    </Group>
                  </Paper>

                  <Paper p="md" radius="lg" style={{ background: 'var(--app-surface-soft)' }}>
                    <Group align="flex-start" gap="sm">
                      <ThemeIcon size={32} radius="lg" variant="light" color="brand">
                        <IconUser size={18} />
                      </ThemeIcon>
                      <div>
                        <Text fw={700}>Personal name</Text>
                        <Text size="sm" c="dimmed">
                          Helps us address the right person on follow-up.
                        </Text>
                      </div>
                    </Group>
                  </Paper>
                </SimpleGrid>
              </Stack>
            </Card>
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, lg: 7 }}>
          <Paper className="app-hero-card" p={{ base: 'lg', sm: 'xl' }} radius="xl">
            <form onSubmit={handleSubmit}>
              <Stack gap="lg">
                <Group justify="space-between" align="flex-start">
                  <div>
                    <Text className="app-page-eyebrow">Request details</Text>
                    <Title order={2} mt="lg">
                      Tell us who you are and what you need
                    </Title>
                  </div>
                  <Button component={Link} to="/" variant="light" leftSection={<IconArrowLeft size={16} />}>
                    Back to home
                  </Button>
                </Group>

                <Select
                  label="Selected offer"
                  description="This defaults from the landing page button you clicked."
                  data={contactOfferOptions}
                  value={form.offer}
                  onChange={(value) => updateField('offer', resolveContactOffer(value))}
                  allowDeselect={false}
                  required
                />

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  <TextInput
                    label="Organisation name"
                    placeholder="Acme Security Ltd"
                    value={form.organization}
                    onChange={(event) => updateField('organization', event.currentTarget.value)}
                  />
                  <TextInput
                    label="Personal name"
                    placeholder="Jane Doe"
                    value={form.personalName}
                    onChange={(event) => updateField('personalName', event.currentTarget.value)}
                  />
                </SimpleGrid>

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  <TextInput
                    label="Role"
                    placeholder="Security lead, founder, procurement..."
                    value={form.role}
                    onChange={(event) => updateField('role', event.currentTarget.value)}
                  />
                  <TextInput
                    label="Email"
                    placeholder="name@company.com"
                    type="email"
                    value={form.email}
                    onChange={(event) => updateField('email', event.currentTarget.value)}
                    required
                  />
                </SimpleGrid>

                <TextInput
                  label="Phone"
                  placeholder="+216 ..."
                  value={form.phone}
                  onChange={(event) => updateField('phone', event.currentTarget.value)}
                />

                <Textarea
                  label="Free message"
                  description="Add any licensing, timeline, scope, or deployment details you want us to know."
                  placeholder="Hi, we’re evaluating CyberSentry for..."
                  minRows={7}
                  value={form.message}
                  onChange={(event) => updateField('message', event.currentTarget.value)}
                  required
                />

                <Paper p="md" radius="lg" style={{ background: 'var(--app-surface-soft)' }}>
                  <Group justify="space-between" align="center" wrap="wrap">
                    <div>
                      <Text fw={800}>Need a different starting point?</Text>
                      <Text size="sm" c="dimmed">
                        Switch the offer above or return to the product pages before sending.
                      </Text>
                    </div>
                    <Button component={Link} to={buildContactTarget('general', 'contact-page-secondary')} variant="light">
                      Open a general inquiry
                    </Button>
                  </Group>
                </Paper>

                <Group justify="space-between" align="center" wrap="wrap">
                  <Button type="submit" size="md" leftSection={<IconSend size={18} />} disabled={!canSubmit}>
                    Send request
                  </Button>
                </Group>

                {!canSubmit && (
                  <Text size="sm" c="dimmed">
                    Add an email address, a meaningful message, and either a personal or organisation name to enable sending.
                  </Text>
                )}
              </Stack>
            </form>
          </Paper>

          <Paper className="app-surface-soft" p="lg" radius="xl" mt="lg" withBorder>
            <Group justify="space-between" align="center" mb="md">
              <div>
                <Text size="sm" c="dimmed">
                  Quick summary
                </Text>
                <Title order={4}>Current request preview</Title>
              </div>
              <Badge variant="light" color="brand">
                {selectedOffer.value}
              </Badge>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
              <Paper p="md" radius="lg" style={{ background: 'var(--app-surface-strong)' }}>
                <Text size="xs" tt="uppercase" fw={800} c="dimmed" style={{ letterSpacing: '0.08em' }}>
                  Organisation
                </Text>
                <Text fw={700} mt={4}>
                  {form.organization || 'Not provided yet'}
                </Text>
              </Paper>
              <Paper p="md" radius="lg" style={{ background: 'var(--app-surface-strong)' }}>
                <Text size="xs" tt="uppercase" fw={800} c="dimmed" style={{ letterSpacing: '0.08em' }}>
                  Contact person
                </Text>
                <Text fw={700} mt={4}>
                  {form.personalName || 'Not provided yet'}
                </Text>
              </Paper>
            </SimpleGrid>

            <Text mt="md" c="dimmed">
              Use this page when you come from a landing page CTA such as a sales inquiry or a plan-specific pricing button.
            </Text>
            <Group mt="lg">
              <Anchor component={Link} to="/#tools" fw={700}>
                Browse tools
              </Anchor>
              <Anchor component={Link} to="/#pricing" fw={700}>
                Review plans
              </Anchor>
            </Group>
          </Paper>
        </Grid.Col>
      </Grid>
    </Container>
  );
};

export const Contact = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const locationState = (location.state as ContactLocationState | null | undefined) ?? {};
  const initialOffer = resolveContactOffer(locationState.offer, searchParams.get('offer'));
  const source = locationState.source ?? searchParams.get('source') ?? 'direct visit';

  return (
    <ContactContent
      key={`${location.key}-${searchParams.toString()}`}
      initialOffer={initialOffer}
      source={source}
    />
  );
};







