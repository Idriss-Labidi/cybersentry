import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Group,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  TextInput,
} from '@mantine/core';
import { IconSettings } from '@tabler/icons-react';
import DashboardPageLayout from '../../layouts/dashboard/DashboardPageLayout';
import { useTheme } from '../../context/theme/useTheme';
import { getUserSettings, updateUserSettings } from '../../services/settings';
import { isPreferredTheme } from '../../styles/theme';
import { notifyError, notifySuccess } from '../../utils/ui-notify';

export const Settings = () => {
  const { preferredTheme, setPreferredTheme } = useTheme();

  const [githubToken, setGithubToken] = useState('');
  const [maskedGithubToken, setMaskedGithubToken] = useState('');
  const [useCache, setUseCache] = useState(true);
  const [cacheDuration, setCacheDuration] = useState<number | string>(60);
  const [themeChoice, setThemeChoice] = useState(preferredTheme);

  const [riskLowThreshold, setRiskLowThreshold] = useState<number | string>(25);
  const [riskMediumThreshold, setRiskMediumThreshold] = useState<number | string>(60);
  const [enableLevel1, setEnableLevel1] = useState(true);
  const [enableLevel2, setEnableLevel2] = useState(true);
  const [enableLevel3, setEnableLevel3] = useState(true);
  const [notificationsEmailEnabled, setNotificationsEmailEnabled] = useState(true);
  const [notificationsWebhookEnabled, setNotificationsWebhookEnabled] = useState(false);
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('');
  const [teamsWebhookUrl, setTeamsWebhookUrl] = useState('');
  const [notificationAlertThreshold, setNotificationAlertThreshold] = useState<number | string>(30);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await getUserSettings();
        const data = response.data;

        setMaskedGithubToken(data.github_token);
        setUseCache(data.use_cache);
        setCacheDuration(data.cache_duration);
        setThemeChoice(data.preferred_theme);
        setPreferredTheme(data.preferred_theme);
        setNotificationsEmailEnabled(data.notifications_email_enabled);
        setNotificationsWebhookEnabled(data.notifications_webhook_enabled);
        setSlackWebhookUrl(data.slack_webhook_url ?? '');
        setTeamsWebhookUrl(data.teams_webhook_url ?? '');
        setNotificationAlertThreshold(data.notification_alert_threshold ?? 70);
      } catch {
        setErrorMessage('Failed to load settings. Please refresh and try again.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadSettings();
  }, [setPreferredTheme]);

  const handleThemeChange = (value: string | null) => {
    if (!value || !isPreferredTheme(value)) {
      return;
    }

    setThemeChoice(value);
    setPreferredTheme(value);
  };

  const handleSaveSettings = async () => {
    setErrorMessage(null);

    if (typeof cacheDuration !== 'number' || cacheDuration < 1 || cacheDuration > 1440) {
      setErrorMessage('Cache duration must be between 1 and 1440 minutes.');
      return;
    }

    if (
      typeof notificationAlertThreshold !== 'number' ||
      notificationAlertThreshold < 0 ||
      notificationAlertThreshold > 100
    ) {
      setErrorMessage('Notification threshold must be between 0 and 100.');
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        use_cache: useCache,
        cache_duration: cacheDuration,
        notifications_email_enabled: notificationsEmailEnabled,
        notifications_webhook_enabled: notificationsWebhookEnabled,
        slack_webhook_url: slackWebhookUrl || '',
        teams_webhook_url: teamsWebhookUrl || '',
        notification_alert_threshold: notificationAlertThreshold,
        preferred_theme: themeChoice,
        ...(githubToken ? { github_token: githubToken } : {}),
      };

      const response = await updateUserSettings(payload);
      setMaskedGithubToken(response.data.github_token);
      setGithubToken('');
      setPreferredTheme(response.data.preferred_theme);
      setNotificationsEmailEnabled(response.data.notifications_email_enabled);
      setNotificationsWebhookEnabled(response.data.notifications_webhook_enabled);
      setSlackWebhookUrl(response.data.slack_webhook_url ?? '');
      setTeamsWebhookUrl(response.data.teams_webhook_url ?? '');
      setNotificationAlertThreshold(response.data.notification_alert_threshold ?? 70);
      notifySuccess('Settings saved', 'Workspace preferences were updated successfully.');
    } catch {
      const message = 'Could not save settings. Please try again.';
      setErrorMessage(message);
      notifyError('Settings save failed', message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardPageLayout
      icon={<IconSettings size={26} />}
      eyebrow="Settings"
      title="Workspace and integration settings"
      description="Manage GitHub integration defaults, cache behavior, accent theme, notifications, and workspace preferences in one place."
    >
      {errorMessage ? (
        <Alert color="red" title="Save error" variant="light">
          {errorMessage}
        </Alert>
      ) : null}

      {isLoading ? (
        <Text c="dimmed">Loading settings...</Text>
      ) : (
        <Stack gap="lg">
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            <Card p="lg">
              <Stack gap="md">
                <Text fw={800}>General settings</Text>
                <Select
                  label="Theme selector"
                  data={[
                    { value: 'green', label: 'Green (default)' },
                    { value: 'blue', label: 'Blue' },
                    { value: 'purple', label: 'Purple' },
                  ]}
                  value={themeChoice}
                  onChange={handleThemeChange}
                />
                <Select
                  label="Language"
                  description="Coming soon"
                  data={[{ value: 'en', label: 'English (default)' }]}
                  value="en"
                  disabled
                />
              </Stack>
            </Card>

            <Card p="lg">
              <Stack gap="md">
                <Text fw={800}>GitHub integration</Text>
                <TextInput
                  label="GitHub token"
                  placeholder="Enter your GitHub Personal Access Token"
                  type="password"
                  value={githubToken}
                  onChange={(event) => setGithubToken(event.currentTarget.value)}
                  description={
                    maskedGithubToken && !githubToken
                      ? `Configured token: ${maskedGithubToken}`
                      : 'Leave empty to keep existing token'
                  }
                />
              </Stack>
            </Card>
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            <Card p="lg">
              <Stack gap="md">
                <Text fw={800}>Security settings</Text>
                <NumberInput
                  label="Low risk threshold"
                  min={1}
                  max={99}
                  value={riskLowThreshold}
                  onChange={setRiskLowThreshold}
                />
                <NumberInput
                  label="Medium risk threshold"
                  min={1}
                  max={99}
                  value={riskMediumThreshold}
                  onChange={setRiskMediumThreshold}
                />
                <Group justify="space-between">
                  <Text>Enable Level 1 checks</Text>
                  <Switch checked={enableLevel1} onChange={(e) => setEnableLevel1(e.currentTarget.checked)} />
                </Group>
                <Group justify="space-between">
                  <Text>Enable Level 2 checks</Text>
                  <Switch checked={enableLevel2} onChange={(e) => setEnableLevel2(e.currentTarget.checked)} />
                </Group>
                <Group justify="space-between">
                  <Text>Enable Level 3 checks</Text>
                  <Switch checked={enableLevel3} onChange={(e) => setEnableLevel3(e.currentTarget.checked)} />
                </Group>
              </Stack>
            </Card>

            <Card p="lg">
              <Stack gap="md">
                <Text fw={800}>Notifications</Text>
                <Group justify="space-between">
                  <Text>Enable email notifications</Text>
                  <Switch checked={notificationsEmailEnabled} onChange={(event) => setNotificationsEmailEnabled(event.currentTarget.checked)} />
                </Group>
                <Group justify="space-between">
                  <Text>Enable webhook notifications</Text>
                  <Switch checked={notificationsWebhookEnabled} onChange={(event) => setNotificationsWebhookEnabled(event.currentTarget.checked)} />
                </Group>
                <TextInput
                  label="Slack webhook URL"
                  placeholder="https://hooks.slack.com/services/..."
                  value={slackWebhookUrl}
                  onChange={(event) => setSlackWebhookUrl(event.currentTarget.value)}
                />
                <TextInput
                  label="Teams webhook URL"
                  placeholder="https://...office.com/webhook/..."
                  value={teamsWebhookUrl}
                  onChange={(event) => setTeamsWebhookUrl(event.currentTarget.value)}
                />
                <NumberInput
                  label="Alert threshold"
                  description="Notification is created when a test score is less than or equal to this value."
                  min={0}
                  max={100}
                  value={notificationAlertThreshold}
                  onChange={setNotificationAlertThreshold}
                />
                <Text c="dimmed" size="sm">
                  Notifications are sent only when an asset test score is 70/100 or higher.
                </Text>
              </Stack>
            </Card>
          </SimpleGrid>

          <Card p="lg">
            <Stack gap="md">
              <Text fw={800}>Advanced settings</Text>
              <Group justify="space-between">
                <Text>Use cached results</Text>
                <Switch checked={useCache} onChange={(event) => setUseCache(event.currentTarget.checked)} />
              </Group>
              <NumberInput
                label="Cache duration (minutes)"
                min={1}
                max={1440}
                value={cacheDuration}
                onChange={setCacheDuration}
              />
            </Stack>
          </Card>

          <Group justify="flex-end">
            <Button onClick={handleSaveSettings} loading={isSaving}>
              Save settings
            </Button>
          </Group>
        </Stack>
      )}
    </DashboardPageLayout>
  );
};
