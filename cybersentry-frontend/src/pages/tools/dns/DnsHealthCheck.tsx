import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Group,
  LoadingOverlay,
  Paper,
  TextInput,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconSearch,
  IconShieldCheck,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import AssetLinkActions from '../../../components/assets/AssetLinkActions';
import DnsHealthResult from '../../../components/dns-intelligence/DnsHealthResult';
import { useAuth } from '../../../context/auth/useAuth';
import ToolPageLayout from '../../../layouts/tools/ToolPageLayout';
import { lookupAsset, type Asset, type AssetPayload } from '../../../services/assets';
import { dnsHealthCheck, type DnsHealthCheckResponse } from '../../../services/dns-tools';
import { getApiErrorMessage } from '../../../utils/api-error';
import { notifyError, notifySuccess } from '../../../utils/ui-notify';

type DnsHealthCheckProps = {
  embedded?: boolean;
};

export const DnsHealthCheck = ({ embedded = false }: DnsHealthCheckProps) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [domain, setDomain] = useState('');
  const [result, setResult] = useState<DnsHealthCheckResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkedAsset, setLinkedAsset] = useState<Asset | null>(null);
  const [assetDefaults, setAssetDefaults] = useState<AssetPayload | null>(null);
  const [assetLookupLoading, setAssetLookupLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !result?.domain) {
      setLinkedAsset(null);
      setAssetDefaults(null);
      setAssetLookupLoading(false);
      return;
    }

    const loadLinkedAsset = async () => {
      setAssetLookupLoading(true);

      try {
        const response = await lookupAsset('domain', result.domain, result.score);
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
  }, [isAuthenticated, result?.domain, result?.score]);

  const handleCheck = async () => {
    if (!domain.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await dnsHealthCheck({ domain_name: domain.trim() });
      setResult(response.data);
      notifySuccess('DNS health check completed', `${response.data.domain} was analyzed successfully.`);
    } catch (error: unknown) {
      const message = getApiErrorMessage(
        error,
        ['domain_name'],
        'An error occurred while performing the health check.'
      );
      setError(message);
      notifyError('DNS health check failed', message);
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

  const content = (
    <>
      <Paper p="lg" radius="xl" pos="relative">
        <LoadingOverlay visible={loading} />
        <Group align="end">
          <TextInput
            label="Domain Name"
            placeholder="example.com"
            value={domain}
            onChange={(event) => setDomain(event.currentTarget.value)}
            onKeyDown={(event) => event.key === 'Enter' && handleCheck()}
            style={{ flex: 1 }}
          />
          <Button leftSection={<IconSearch size={18} />} onClick={handleCheck} disabled={!domain.trim()}>
            Run health check
          </Button>
        </Group>
      </Paper>

      {error ? (
        <Alert icon={<IconAlertCircle size={18} />} color="red" title="Error" variant="light">
          {error}
        </Alert>
      ) : null}

      {result ? (
        <DnsHealthResult
          result={result}
          actions={
            <AssetLinkActions
              linkedAsset={linkedAsset}
              canSaveAsAsset={!!assetDefaults}
              assetLookupLoading={assetLookupLoading}
              onOpenLinkedAsset={(asset) => navigate(`/dashboard/assets/${asset.id}`)}
              onSaveAsAsset={handleSaveAsAsset}
            />
          }
        />
      ) : null}
    </>
  );

  if (embedded) {
    return content;
  }

  return (
    <ToolPageLayout
      icon={<IconShieldCheck size={26} />}
      eyebrow="Public tool"
      title="DNS health check"
      description="Analyze DNS posture, score the configuration, and review high-priority remediation guidance."
      workflow={[
        'Submit the domain to run a full DNS hygiene pass.',
        'Review the score and grade before drilling into individual checks.',
        'Use the recommendation list to prioritize remediation work.',
      ]}
      notes={[
        'A lower score does not always mean broad failure. Review the impacted checks and severity labels together.',
        'This page is best used after a standard DNS lookup when you need a posture-oriented view.',
      ]}
      examples={['example.com', 'openai.com', 'cloudflare.com']}
    >
      {content}
    </ToolPageLayout>
  );
};
