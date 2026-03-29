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
    } catch (runError: unknown) {
      setError(getApiErrorMessage(runError, [], 'Failed to run DNS monitoring.'));
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
    } catch (runError: unknown) {
      setError(getApiErrorMessage(runError, [], 'Failed to run IP reputation check.'));
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
    } catch (runError: unknown) {
      setError(getApiErrorMessage(runError, [], 'Failed to run GitHub health check.'));
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
