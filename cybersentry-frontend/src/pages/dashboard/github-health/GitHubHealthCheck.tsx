import { useEffect, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Center,
  Group,
  MultiSelect,
  Paper,
  RingProgress,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import { IconAlertCircle, IconCheck, IconExternalLink, IconSearch, IconShield } from '@tabler/icons-react';
import type { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import GitHubCheckSections from '../../../components/github-health/GitHubCheckSections';
import { useAuth } from '../../../context/auth/useAuth';
import { lookupAsset, type Asset, type AssetPayload } from '../../../services/assets';
import { checkRepositoryHealth } from '../../../services/github-tools';
import { getUserSettings } from '../../../services/settings';
import { getRiskColor, getRiskLabel } from '../../../utils/githubHealthUtils';
import type { CheckResponse } from '../../../utils/githubHealthPage';

type GitHubHealthCheckProps = {
  onCheckComplete?: () => void;
};

const renderRingLabel = (value: number) => (
  <Text component="div" fw={700} ta="center" style={{ width: '100%' }}>
    {value}%
  </Text>
);

const GitHubHealthCheck = ({ onCheckComplete }: GitHubHealthCheckProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [url, setUrl] = useState('');
  const [levels, setLevels] = useState<string[]>(['1', '2', '3']);
  const [useCache, setUseCache] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckResponse | null>(null);
  const [linkedAsset, setLinkedAsset] = useState<Asset | null>(null);
  const [assetDefaults, setAssetDefaults] = useState<AssetPayload | null>(null);
  const [assetLookupLoading, setAssetLookupLoading] = useState(false);

  useEffect(() => {
    const loadCachePreference = async () => {
      try {
        const response = await getUserSettings();
        setUseCache(response.data.use_cache);
      } catch {
        // Keep local default.
      }
    };

    void loadCachePreference();
  }, []);

  useEffect(() => {
    const repositoryUrl = result?.result.repository.url;
    if (!repositoryUrl) {
      setLinkedAsset(null);
      setAssetDefaults(null);
      return;
    }

    const loadLinkedAsset = async () => {
      setAssetLookupLoading(true);

      try {
        const response = await lookupAsset('github_repo', repositoryUrl, result.result.risk_score);
        setLinkedAsset(response.data.asset);
        setAssetDefaults(response.data.defaults);
      } catch {
        setLinkedAsset(null);
        setAssetDefaults(null);
      } finally {
        setAssetLookupLoading(false);
      }
    };

    void loadLinkedAsset();
  }, [result?.result.repository.url, result?.result.risk_score]);

  const handleCheck = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!url.trim()) {
      setError('Please enter a GitHub repository URL.');
      return;
    }

    if (!user?.access_token) {
      setError('You must be logged in to run this check. Please sign in again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await checkRepositoryHealth<CheckResponse>({
        url: url.trim(),
        levels,
        use_cache: useCache,
      });
      setResult(response.data);
      onCheckComplete?.();
    } catch (requestError: unknown) {
      const axiosError = requestError as AxiosError<{ error?: string }>;
      setError(axiosError.response?.data?.error ?? 'Failed to check repository.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAsAsset = () => {
    if (!assetDefaults) {
      return;
    }

    navigate('/dashboard/assets', {
      state: {
        prefillAsset: assetDefaults,
      },
    });
  };

  return (
    <Stack gap="xl">
      <Card withBorder radius="md" padding="lg">
        <form onSubmit={handleCheck}>
          <Stack gap="md">
            <TextInput
              label="GitHub Repository URL"
              placeholder="https://github.com/owner/repo"
              value={url}
              onChange={(event) => setUrl(event.currentTarget.value)}
            />

            <MultiSelect
              label="Check Levels"
              placeholder="Select levels to check"
              data={[
                { value: '1', label: 'Level 1: REST API & Metrics' },
                { value: '2', label: 'Level 2: File Inspection' },
                { value: '3', label: 'Level 3: Security APIs' },
              ]}
              value={levels}
              onChange={setLevels}
              searchable
              clearable
            />

            <Group justify="space-between">
              <Text size="sm">
                <Tooltip label="Use cached results from less than 1 hour ago">
                  <span>Use cached results</span>
                </Tooltip>
              </Text>
              <Button size="xs" variant={useCache ? 'default' : 'light'} onClick={() => setUseCache(!useCache)}>
                {useCache ? 'Enabled' : 'Disabled'}
              </Button>
            </Group>

            <Button type="submit" fullWidth size="md" loading={loading} leftSection={<IconSearch size={16} />}>
              {loading ? 'Checking Repository...' : 'Check Repository'}
            </Button>
          </Stack>
        </form>
      </Card>

      {error ? (
        <Alert icon={<IconAlertCircle size={16} />} color="red" title="Error">
          {error}
        </Alert>
      ) : null}

      {result ? (
        <Stack gap="xl">
          {result.message ? (
            <Alert icon={<IconCheck size={16} />} color="blue">
              {result.message}
            </Alert>
          ) : null}

          <Paper p="lg" radius="md" withBorder>
            <Group justify="space-between" mb="md">
              <div>
                <Title order={2}>
                  {result.result.repository.owner}/{result.result.repository.name}
                </Title>
                <Text size="sm" c="dimmed" mt={4}>
                  {result.result.repository.url}
                </Text>
              </div>
              <Center>
                <RingProgress
                  sections={[{ value: result.result.risk_score, color: getRiskColor(result.result.risk_score) }]}
                  label={renderRingLabel(result.result.risk_score)}
                  size={110}
                />
              </Center>
            </Group>

            <Group gap="sm" mb="md">
              <Badge size="lg" color={getRiskColor(result.result.risk_score)}>
                {getRiskLabel(result.result.risk_score)}
              </Badge>
              <Badge variant="light">{result.result.summary}</Badge>
            </Group>

            <Group gap="sm" mb="md">
              {linkedAsset ? (
                <Button
                  variant="light"
                  onClick={() => navigate(`/dashboard/assets/${linkedAsset.id}`)}
                  leftSection={<IconExternalLink size={16} />}
                >
                  Open linked asset
                </Button>
              ) : assetDefaults ? (
                <Button variant="light" onClick={handleSaveAsAsset} leftSection={<IconShield size={16} />}>
                  Save as asset
                </Button>
              ) : null}
              {assetLookupLoading ? (
                <Text size="sm" c="dimmed">
                  Checking asset inventory link...
                </Text>
              ) : null}
            </Group>

            <GitHubCheckSections detail={result.result} />
          </Paper>
        </Stack>
      ) : null}
    </Stack>
  );
};

export default GitHubHealthCheck;
