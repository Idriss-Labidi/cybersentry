import { useState } from 'react';
import { Container, Stack, Tabs, Text, Title } from '@mantine/core';
import { IconHistory, IconSearch } from '@tabler/icons-react';
import GitHubHealthCheck from './GitHubHealthCheck';
import GitHubHealthCheckHistory from './GitHubHealthCheckHistory';

type GitHubProps = {
  initialTab?: 'scan' | 'history';
};

const GitHub = ({ initialTab = 'scan' }: GitHubProps) => {
  const [historyRefreshToken, setHistoryRefreshToken] = useState(0);

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
