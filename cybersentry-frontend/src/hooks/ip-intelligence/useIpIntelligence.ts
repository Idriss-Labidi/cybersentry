import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { lookupAsset, type Asset, type AssetPayload } from '../../services/assets';
import {
  advancedIpReputation,
  deleteScanHistoryEntry,
  getScanHistory,
  type IpReputationResponse,
  type IPReputationScanHistory,
} from '../../services/ip-tools';
import { getApiErrorMessage } from '../../utils/api-error';
import { HISTORY_PAGE_SIZE } from '../../utils/ip-intelligence';

export function useIpIntelligence() {
  const navigate = useNavigate();
  const [ipInput, setIpInput] = useState('');
  const [ipResult, setIpResult] = useState<IpReputationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [scans, setScans] = useState<IPReputationScanHistory[]>([]);
  const [selectedScan, setSelectedScan] = useState<IPReputationScanHistory | null>(null);
  const [detailsModalOpened, setDetailsModalOpened] = useState(false);
  const [historyLimit, setHistoryLimit] = useState(HISTORY_PAGE_SIZE);
  const [deletingScanId, setDeletingScanId] = useState<number | null>(null);
  const [linkedAsset, setLinkedAsset] = useState<Asset | null>(null);
  const [assetDefaults, setAssetDefaults] = useState<AssetPayload | null>(null);
  const [assetLookupLoading, setAssetLookupLoading] = useState(false);

  const loadHistory = async (limit = historyLimit) => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const response = await getScanHistory(limit);
      setScans(response.data.ip_scans);
    } catch (historyError: unknown) {
      setHistoryError(getApiErrorMessage(historyError, [], 'Failed to load IP scan history.'));
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    void loadHistory(historyLimit);
  }, [historyLimit]);

  useEffect(() => {
    if (!ipResult?.ip) {
      setLinkedAsset(null);
      setAssetDefaults(null);
      return;
    }

    const loadLinkedAsset = async () => {
      setAssetLookupLoading(true);

      try {
        const response = await lookupAsset('ip', ipResult.ip);
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
  }, [ipResult?.ip]);

  const handleIpCheck = async () => {
    if (!ipInput.trim()) {
      return;
    }

    setLoading(true);
    setError(null);
    setIpResult(null);

    try {
      const response = await advancedIpReputation({ ip_address: ipInput.trim() });
      setIpResult(response.data);
      await loadHistory(historyLimit);
    } catch (requestError: unknown) {
      setError(
        getApiErrorMessage(
          requestError,
          ['ip_address'],
          'An error occurred while checking IP reputation.'
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (scan: IPReputationScanHistory) => {
    setSelectedScan(scan);
    setDetailsModalOpened(true);
  };

  const handleDeleteScan = async (scanId: number) => {
    setDeletingScanId(scanId);
    setHistoryError(null);

    try {
      await deleteScanHistoryEntry(scanId);
      setScans((current) => current.filter((scan) => scan.id !== scanId));

      if (selectedScan?.id === scanId) {
        setSelectedScan(null);
        setDetailsModalOpened(false);
      }
    } catch (deleteError: unknown) {
      setHistoryError(getApiErrorMessage(deleteError, [], 'Failed to delete IP scan.'));
    } finally {
      setDeletingScanId(null);
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

  return {
    ipInput,
    ipResult,
    loading,
    error,
    historyLoading,
    historyError,
    scans,
    selectedScan,
    detailsModalOpened,
    deletingScanId,
    linkedAsset,
    assetDefaults,
    assetLookupLoading,
    canLoadMoreHistory: scans.length >= historyLimit,
    setIpInput,
    setDetailsModalOpened,
    setHistoryLimit,
    handleIpCheck,
    handleViewDetails,
    handleDeleteScan,
    handleSaveAsAsset,
  };
}
