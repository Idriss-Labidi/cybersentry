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
import { notifyError, notifySuccess } from '../../utils/ui-notify';

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
  const [selectedScanLinkedAsset, setSelectedScanLinkedAsset] = useState<Asset | null>(null);
  const [selectedScanAssetDefaults, setSelectedScanAssetDefaults] = useState<AssetPayload | null>(null);
  const [selectedScanAssetLookupLoading, setSelectedScanAssetLookupLoading] = useState(false);

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
        const response = await lookupAsset('ip', ipResult.ip, ipResult.score);
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
  }, [ipResult?.ip, ipResult?.score]);

  useEffect(() => {
    if (!selectedScan?.ip_address) {
      setSelectedScanLinkedAsset(null);
      setSelectedScanAssetDefaults(null);
      return;
    }

    const loadSelectedScanLinkedAsset = async () => {
      setSelectedScanAssetLookupLoading(true);

      try {
        const response = await lookupAsset('ip', selectedScan.ip_address, selectedScan.reputation_score);
        setSelectedScanLinkedAsset(response.data.asset);
        setSelectedScanAssetDefaults(response.data.defaults);
      } catch {
        setSelectedScanLinkedAsset(null);
        setSelectedScanAssetDefaults(null);
      } finally {
        setSelectedScanAssetLookupLoading(false);
      }
    };

    void loadSelectedScanLinkedAsset();
  }, [selectedScan?.ip_address, selectedScan?.reputation_score]);

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
      notifySuccess('IP scan completed', `Reputation intelligence was updated for ${response.data.ip}.`);
    } catch (requestError: unknown) {
      const message = getApiErrorMessage(
        requestError,
        ['ip_address'],
        'An error occurred while checking IP reputation.'
      );
      setError(message);
      notifyError('IP scan failed', message);
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
      notifySuccess('IP scan deleted', 'The scan entry was removed from history.');

      if (selectedScan?.id === scanId) {
        setSelectedScan(null);
        setDetailsModalOpened(false);
      }
    } catch (deleteError: unknown) {
      const message = getApiErrorMessage(deleteError, [], 'Failed to delete IP scan.');
      setHistoryError(message);
      notifyError('IP deletion failed', message);
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

  const handleSaveSelectedScanAsAsset = () => {
    if (!selectedScanAssetDefaults) {
      return;
    }

    navigate('/dashboard/assets', {
      state: {
        prefillAsset: selectedScanAssetDefaults,
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
    selectedScanLinkedAsset,
    selectedScanAssetDefaults,
    selectedScanAssetLookupLoading,
    canLoadMoreHistory: scans.length >= historyLimit,
    setIpInput,
    setDetailsModalOpened,
    setHistoryLimit,
    handleIpCheck,
    handleViewDetails,
    handleDeleteScan,
    handleSaveAsAsset,
    handleSaveSelectedScanAsAsset,
  };
}
