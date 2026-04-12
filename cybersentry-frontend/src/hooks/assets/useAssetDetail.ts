import { useEffect, useState } from 'react';
import {
  getAsset,
  getAssetRelatedContext,
  getAssetRiskHistory,
  runAssetDnsMonitor,
  runAssetGitHubHealth,
  runAssetIpReputation,
  type Asset,
  type AssetRelatedContextResponse,
  type AssetRiskHistoryEntry,
} from '../../services/assets';
import { getApiErrorMessage } from '../../utils/api-error';
import { notifyError, notifySuccess } from '../../utils/ui-notify';

export const useAssetDetail = (assetId: number) => {
  const [asset, setAsset] = useState<Asset | null>(null);
  const [riskHistory, setRiskHistory] = useState<AssetRiskHistoryEntry[]>([]);
  const [relatedContext, setRelatedContext] = useState<AssetRelatedContextResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningDns, setIsRunningDns] = useState(false);
  const [isRunningIp, setIsRunningIp] = useState(false);
  const [isRunningGitHub, setIsRunningGitHub] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAssetData = async () => {
    if (!Number.isFinite(assetId)) {
      setError('Invalid asset id.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [assetResponse, historyResponse, relatedContextResponse] = await Promise.all([
        getAsset(assetId),
        getAssetRiskHistory(assetId),
        getAssetRelatedContext(assetId),
      ]);

      setAsset(assetResponse.data);
      setRiskHistory(historyResponse.data.entries);
      setRelatedContext(relatedContextResponse.data);
    } catch (loadError: unknown) {
      setError(getApiErrorMessage(loadError, [], 'Failed to load asset details.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAssetData();
  }, [assetId]);

  const handleRunDnsMonitor = async () => {
    if (!asset) {
      return;
    }

    setIsRunningDns(true);
    setError(null);

    try {
      await runAssetDnsMonitor(asset.id);
      await loadAssetData();
      notifySuccess('DNS monitor completed', `DNS monitoring finished for ${asset.name}.`);
    } catch (runError: unknown) {
      const message = getApiErrorMessage(runError, [], 'Failed to run DNS monitoring.');
      setError(message);
      notifyError('DNS monitoring failed', message);
    } finally {
      setIsRunningDns(false);
    }
  };

  const handleRunIpReputation = async () => {
    if (!asset) {
      return;
    }

    setIsRunningIp(true);
    setError(null);

    try {
      await runAssetIpReputation(asset.id);
      await loadAssetData();
      notifySuccess('IP reputation completed', `IP intelligence was refreshed for ${asset.name}.`);
    } catch (runError: unknown) {
      const message = getApiErrorMessage(runError, [], 'Failed to run IP reputation check.');
      setError(message);
      notifyError('IP reputation failed', message);
    } finally {
      setIsRunningIp(false);
    }
  };

  const handleRunGitHubHealth = async () => {
    if (!asset) {
      return;
    }

    setIsRunningGitHub(true);
    setError(null);

    try {
      await runAssetGitHubHealth(asset.id);
      await loadAssetData();
      notifySuccess('GitHub health completed', `Repository health was refreshed for ${asset.name}.`);
    } catch (runError: unknown) {
      const message = getApiErrorMessage(runError, [], 'Failed to run GitHub health check.');
      setError(message);
      notifyError('GitHub health failed', message);
    } finally {
      setIsRunningGitHub(false);
    }
  };

  return {
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
  };
};
