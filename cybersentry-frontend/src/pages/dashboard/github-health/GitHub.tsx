import { useState } from 'react';
import { Container, Stack, Tabs, Text, Title } from '@mantine/core';
import { IconHistory, IconSearch } from '@tabler/icons-react';
import { GuidanceGroup, type GuidanceItem } from '../../../components/guidance/GuidanceHoverCard';
import GitHubHealthCheck from './GitHubHealthCheck';
import GitHubHealthCheckHistory from './GitHubHealthCheckHistory';

type GitHubProps = {
  initialTab?: 'scan' | 'history';
};

const GitHub = ({ initialTab = 'scan' }: GitHubProps) => {
  const [historyRefreshToken, setHistoryRefreshToken] = useState(0);
  const guidanceItems: GuidanceItem[] = [
    {
      label: 'What this page covers',
      title: 'GitHub health overview',
      description:
        'This page evaluates repository hygiene, maintenance, documentation, community signals, and security-related GitHub features.',
      bullets: [
        'New Check runs a repository assessment and builds a risk score.',
        'History lets you review previous checks and compare drift over time.',
      ],
      badge: 'GitHub',
    },
    {
      label: 'How to read results',
      title: 'Interpreting repository checks',
      description:
        'The risk score is an overall signal. The detailed sections explain which dimensions are pulling the score up or down.',
      bullets: [
        'Level 1 is general hygiene and maintenance context.',
        'Level 2 focuses on repository files and code-quality signals.',
        'Level 3 depends on GitHub features and token permissions, so missing data is sometimes expected.',
      ],
    },
  ];

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={1} mb="sm">
            GitHub Health
          </Title>
          <Text c="dimmed">
            Run repository checks and review the full GitHub history from one page.
          </Text>
          <GuidanceGroup items={guidanceItems} />
        </div>

        <Tabs defaultValue={initialTab}>
          <Tabs.List>
            <Tabs.Tab value="scan" leftSection={<IconSearch size={16} />}>
              New Check
            </Tabs.Tab>
            <Tabs.Tab value="history" leftSection={<IconHistory size={16} />}>
              History
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="scan" pt="xl">
            <GitHubHealthCheck onCheckComplete={() => setHistoryRefreshToken((current) => current + 1)} />
          </Tabs.Panel>

          <Tabs.Panel value="history" pt="xl">
            <GitHubHealthCheckHistory refreshToken={historyRefreshToken} />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
};

export default GitHub;
