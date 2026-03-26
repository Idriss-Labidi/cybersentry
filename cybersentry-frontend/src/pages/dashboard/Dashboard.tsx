import { useEffect, useMemo, useState } from 'react';
import { Alert, Group, Paper, SimpleGrid, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconActivityHeartbeat, IconRadar2, IconServer2, IconShieldCheck } from '@tabler/icons-react';
import DashboardPageLayout, { DashboardStatCards } from '../../layouts/dashboard/DashboardPageLayout';
import { getAssetSummary, type AssetSummaryResponse } from '../../services/assets';

const emptySummary: AssetSummaryResponse = {
  total_assets: 0,
  high_risk_assets: 0,
  average_risk_score: 0,
  by_category: {
    production: 0,
    development: 0,
    test: 0,
  },
  by_type: {
    domain: 0,
    ip: 0,
    website: 0,
    github_repo: 0,
  },
};

export const Dashboard = () => {
  const [summary, setSummary] = useState<AssetSummaryResponse>(emptySummary);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const response = await getAssetSummary();
        setSummary(response.data);
      } catch {
        setError('Unable to load live asset KPIs.');
      }
    };

    void loadSummary();
  }, []);

  const heroMetrics = useMemo(
    () => [
      { label: 'Managed assets', value: String(summary.total_assets), hint: 'Tracked in the authenticated workspace' },
      { label: 'High risk assets', value: String(summary.high_risk_assets), hint: 'Currently scored at 70/100 or above' },
      { label: 'Average risk', value: `${summary.average_risk_score}/100`, hint: 'Rolling baseline for monitored assets' },
    ],
    [summary]
  );

  return (
    <DashboardPageLayout
      icon={<IconRadar2 size={26} />}
      eyebrow="Overview"
      title="Operational security overview"
      description="Track your authenticated asset inventory, risk posture, and upcoming automation targets from a single dashboard surface."
      metrics={heroMetrics}
    >
      {error ? (
        <Alert color="yellow" variant="light">
          {error}
        </Alert>
      ) : null}

      <DashboardStatCards
        items={[
          { label: 'Domains', value: String(summary.by_type.domain), hint: 'Registered domains under watch' },
          { label: 'IPs', value: String(summary.by_type.ip), hint: 'Addresses attached to the workspace' },
          { label: 'Websites', value: String(summary.by_type.website), hint: 'Web properties prepared for scanning' },
          { label: 'GitHub repos', value: String(summary.by_type.github_repo), hint: 'Repositories integrated into the asset layer' },
        ]}
      />

      <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="lg">
        <Paper p="lg">
          <Group gap="sm" mb="md">
            <ThemeIcon size={42} radius="xl" variant="light" color="brand">
              <IconActivityHeartbeat size={20} />
            </ThemeIcon>
            <div>
              <Text fw={800}>Environment coverage</Text>
              <Text size="sm" c="dimmed">
                Asset mix across the authenticated workspace.
              </Text>
            </div>
          </Group>
          <Stack gap="sm">
            <Text>Production assets: {summary.by_category.production}</Text>
            <Text>Development assets: {summary.by_category.development}</Text>
            <Text>Test assets: {summary.by_category.test}</Text>
          </Stack>
        </Paper>

        <Paper p="lg">
          <Group gap="sm" mb="md">
            <ThemeIcon size={42} radius="xl" variant="light" color="brand">
              <IconShieldCheck size={20} />
            </ThemeIcon>
            <div>
              <Text fw={800}>Control health</Text>
              <Text size="sm" c="dimmed">
                Baseline risk posture before automated scans land.
              </Text>
            </div>
          </Group>
          <Stack gap="sm">
            <Text>Average asset risk currently sits at {summary.average_risk_score}/100</Text>
            <Text>{summary.high_risk_assets} assets already need closer review</Text>
            <Text>Risk history snapshots are now persisted for future trend views</Text>
          </Stack>
        </Paper>

        <Paper p="lg">
          <Group gap="sm" mb="md">
            <ThemeIcon size={42} radius="xl" variant="light" color="brand">
              <IconServer2 size={20} />
            </ThemeIcon>
            <div>
              <Text fw={800}>Next operator focus</Text>
              <Text size="sm" c="dimmed">
                Ready follow-up work for the next dashboard phases.
              </Text>
            </div>
          </Group>
          <Text c="dimmed">
            The asset inventory foundation is now in place. The next logical additions are scheduled DNS monitoring, website content diffing, and cross-channel alert delivery.
          </Text>
        </Paper>
      </SimpleGrid>
    </DashboardPageLayout>
  );
};
