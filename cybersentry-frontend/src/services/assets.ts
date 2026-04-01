import axiosInstance from '../utils/axios-instance';
import type { IPReputationScanHistory, IpReputationResponse } from './ip-tools';
import type { DnsHealthHistoryEntry } from './dns-tools';

export type AssetType = 'domain' | 'ip' | 'website' | 'github_repo';
export type AssetCategory = 'production' | 'development' | 'test';
export type AssetStatus = 'active' | 'paused' | 'archived';

export interface AssetTag {
  id: number;
  name: string;
}

export interface Asset {
  id: number;
  name: string;
  asset_type: AssetType;
  asset_type_label: string;
  value: string;
  category: AssetCategory;
  category_label: string;
  status: AssetStatus;
  status_label: string;
  description: string;
  risk_score: number;
  last_scanned_at: string | null;
  tags: AssetTag[];
  created_at: string;
  updated_at: string;
}

export interface AssetPayload {
  name: string;
  asset_type: AssetType;
  value: string;
  category: AssetCategory;
  status: AssetStatus;
  description: string;
  risk_score: number;
  tag_names: string[];
}

export interface AssetSummaryResponse {
  total_assets: number;
  high_risk_assets: number;
  average_risk_score: number;
  by_category: Record<AssetCategory, number>;
  by_type: Record<AssetType, number>;
}

export interface AssetRiskHistoryEntry {
  id: number;
  score: number;
  source: string;
  note: string;
  calculated_at: string;
}

export interface AssetRiskHistoryResponse {
  entries: AssetRiskHistoryEntry[];
}

export interface AssetDnsSnapshot {
  id: number;
  status: 'success' | 'failed';
  record_types: string[];
  records: Record<string, string[]>;
  error_message: string;
  scanned_at: string;
}

export interface AssetDnsChangeEvent {
  id: number;
  record_type: string;
  change_type: 'added' | 'removed' | 'modified' | 'status';
  severity: 'low' | 'medium' | 'high';
  summary: string;
  previous_value: string[];
  current_value: string[];
  created_at: string;
}

export interface AssetAlert {
  id: number;
  alert_type: 'dns_change';
  severity: 'low' | 'medium' | 'high';
  title: string;
  detail: string;
  metadata: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface AssetLookupResponse {
  found: boolean;
  asset: Asset | null;
  lookup: {
    asset_type: AssetType;
    value: string;
  };
  defaults: AssetPayload;
}

export interface GitHubRepositoryLink {
  id: number;
  owner: string;
  name: string;
  url: string;
  organization: number;
  created_at: string;
  last_check_at: string | null;
}

export interface GitHubCheckResultSummary {
  id: number;
  repository_url: string;
  repository_name: string;
  risk_score: number;
  summary: string;
  check_timestamp: string;
}

export interface GitHubWarningItem {
  level: string;
  message: string;
  category: string;
}

export interface GitHubCheckResultDetail {
  id: number;
  repository: GitHubRepositoryLink;
  risk_score: number;
  level1_data?: Record<string, unknown>;
  level2_data?: Record<string, unknown>;
  level3_data?: Record<string, unknown>;
  summary: string;
  warnings?: GitHubWarningItem[];
  recommendations?: string[];
  check_timestamp: string;
}

export interface AssetRelatedContextResponse {
  asset_type: AssetType;
  message: string;
  ip_reputation: {
    lookup_value: string;
    latest_scan: IPReputationScanHistory | null;
    history: IPReputationScanHistory[];
  } | null;
  github_health: {
    lookup_value: string;
    repository: GitHubRepositoryLink | null;
    latest_result: GitHubCheckResultDetail | null;
    history: GitHubCheckResultSummary[];
  } | null;
  dns_monitor: {
    lookup_value: string;
    latest_snapshot: AssetDnsSnapshot | null;
    snapshots: AssetDnsSnapshot[];
    recent_changes: AssetDnsChangeEvent[];
    alerts: AssetAlert[];
    latest_health_check: DnsHealthHistoryEntry | null;
    health_history: DnsHealthHistoryEntry[];
  } | null;
}

export interface AssetRunIpResponse {
  result: IpReputationResponse;
}

export interface AssetRunGitHubHealthResponse {
  message?: string;
  result?: GitHubCheckResultDetail;
  score_breakdown?: Record<string, number>;
  risk_category?: string;
  error?: string;
}

export interface AssetRunDnsMonitorResponse {
  snapshot: AssetDnsSnapshot;
  changes: AssetDnsChangeEvent[];
  alert: AssetAlert | null;
  health_check: DnsHealthHistoryEntry;
}

export const getAssets = () => axiosInstance.get<Asset[]>('/api/assets/');

export const getAsset = (id: number) => axiosInstance.get<Asset>(`/api/assets/${id}/`);

export const getAssetSummary = () => axiosInstance.get<AssetSummaryResponse>('/api/assets/summary/');

export const createAsset = (data: AssetPayload) => axiosInstance.post<Asset>('/api/assets/', data);

export const updateAsset = (id: number, data: AssetPayload) =>
  axiosInstance.put<Asset>(`/api/assets/${id}/`, data);

export const deleteAsset = (id: number) => axiosInstance.delete(`/api/assets/${id}/`);

export const getAssetRiskHistory = (id: number) =>
  axiosInstance.get<AssetRiskHistoryResponse>(`/api/assets/${id}/risk_history/`);

export const lookupAsset = (assetType: AssetType, value: string, riskScore?: number) =>
  axiosInstance.get<AssetLookupResponse>('/api/assets/lookup/', {
    params: { asset_type: assetType, value, risk_score: riskScore },
  });

export const getAssetRelatedContext = (id: number) =>
  axiosInstance.get<AssetRelatedContextResponse>(`/api/assets/${id}/related_context/`);

export const runAssetIpReputation = (id: number) =>
  axiosInstance.post<AssetRunIpResponse>(`/api/assets/${id}/run_ip_reputation/`);

export const runAssetGitHubHealth = (id: number, data?: { levels?: string[]; use_cache?: boolean }) =>
  axiosInstance.post<AssetRunGitHubHealthResponse>(`/api/assets/${id}/run_github_health/`, data ?? {});

export const runAssetDnsMonitor = (id: number) =>
  axiosInstance.post<AssetRunDnsMonitorResponse>(`/api/assets/${id}/run_dns_monitor/`);
