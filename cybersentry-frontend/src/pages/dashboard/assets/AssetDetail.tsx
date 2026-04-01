import { useEffect, useMemo } from 'react';
import { Alert, Button, Group } from '@mantine/core';
import { IconArrowLeft, IconRefresh, IconServer2 } from '@tabler/icons-react';
import { Link, useParams } from 'react-router-dom';
import { AssetAutomationPlaceholder } from '../../../components/assets/AssetAutomationPlaceholder';
import { AssetDnsMonitoringCard } from '../../../components/assets/AssetDnsMonitoringCard';
import { AssetGitHubIntelligenceCard } from '../../../components/assets/AssetGitHubIntelligenceCard';
import { AssetIdentityCard } from '../../../components/assets/AssetIdentityCard';
import { AssetIpIntelligenceCard } from '../../../components/assets/AssetIpIntelligenceCard';
import { AssetRiskHistoryCard } from '../../../components/assets/AssetRiskHistoryCard';
import { useAssetDetail } from '../../../hooks/assets/useAssetDetail';
import { useDashboardBreadcrumb } from '../../../layouts/dashboard/DashboardBreadcrumbContext';
import DashboardPageLayout from '../../../layouts/dashboard/DashboardPageLayout';
import { formatDateTime } from '../../../utils/assets/assetDetail';

export const AssetDetail = () => {
  const { id } = useParams();
  const { setCurrentLabel } = useDashboardBreadcrumb();
  const assetId = Number(id);
  const {
    asset,
    riskHistory,
    relatedContext,
    isLoading,
    isRunningDns,
    isRunningIp,
    isRunningGitHub,
    error,
    loadAssetData,
    handleRunDnsMonitor,
    handleRunIpReputation,
    handleRunGitHubHealth,
  } = useAssetDetail(assetId);

  useEffect(() => {
    setCurrentLabel(asset?.name ?? null);

    return () => {
      setCurrentLabel(null);
    };
  }, [asset?.name, setCurrentLabel]);

  const metrics = useMemo(() => {
    if (!asset) {
      return [];
    }

    return [
      {
        label: 'Current baseline risk',
        value: `${asset.risk_score}/100`,
        hint: 'Manual baseline score until automated scoring is introduced.',
      },
      {
        label: 'Last scan',
        value: asset.last_scanned_at ? 'Available' : 'Pending',
        hint: formatDateTime(asset.last_scanned_at),
      },
      {
        label: 'Risk snapshots',
        value: String(riskHistory.length),
        hint: 'Historical baseline score checkpoints for this asset.',
      },
    ];
  }, [asset, riskHistory.length]);

  return (
    <DashboardPageLayout
      icon={<IconServer2 size={26} />}
      eyebrow="Assets"
      title={asset?.name ?? 'Asset detail'}
      description={
        asset
          ? `Central asset view for ${asset.value} with its baseline risk history and linked intelligence.`
          : 'Loading asset details and linked intelligence.'
      }
      metrics={metrics}
      actions={
        <Group gap="sm">
          <Button
            variant="default"
            component={Link}
            to="/dashboard/assets"
            leftSection={<IconArrowLeft size={16} />}
          >
            Back to assets
          </Button>
          <Button variant="light" onClick={() => void loadAssetData()} leftSection={<IconRefresh size={16} />}>
            Refresh
          </Button>
        </Group>
      }
    >
      {error ? (
        <Alert color="red" variant="light" title="Asset detail unavailable">
          {error}
        </Alert>
      ) : null}

      {asset ? (
        <>
          <AssetIdentityCard asset={asset} isLoading={isLoading} />
          <AssetRiskHistoryCard riskHistory={riskHistory} isLoading={isLoading} />

          {asset.asset_type === 'domain' ? (
            <AssetDnsMonitoringCard
              dnsContext={relatedContext?.dns_monitor ?? null}
              isLoading={isLoading}
              isRunningDns={isRunningDns}
              onRunDnsMonitor={() => void handleRunDnsMonitor()}
            />
          ) : asset.asset_type === 'ip' ? (
            <AssetIpIntelligenceCard
              ipContext={relatedContext?.ip_reputation ?? null}
              isLoading={isLoading}
              isRunningIp={isRunningIp}
              onRunIpReputation={() => void handleRunIpReputation()}
            />
          ) : asset.asset_type === 'github_repo' ? (
            <AssetGitHubIntelligenceCard
              githubContext={relatedContext?.github_health ?? null}
              isLoading={isLoading}
              isRunningGitHub={isRunningGitHub}
              onRunGitHubHealth={() => void handleRunGitHubHealth()}
            />
          ) : (
            <AssetAutomationPlaceholder message={relatedContext?.message} />
          )}
        </>
      ) : null}
    </DashboardPageLayout>
  );
};
