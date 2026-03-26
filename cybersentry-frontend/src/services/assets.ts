import axiosInstance from '../utils/axios-instance';

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

export const getAssets = () => axiosInstance.get<Asset[]>('/api/assets/');

export const getAssetSummary = () => axiosInstance.get<AssetSummaryResponse>('/api/assets/summary/');

export const createAsset = (data: AssetPayload) => axiosInstance.post<Asset>('/api/assets/', data);

export const updateAsset = (id: number, data: AssetPayload) =>
  axiosInstance.put<Asset>(`/api/assets/${id}/`, data);

export const deleteAsset = (id: number) => axiosInstance.delete(`/api/assets/${id}/`);

export const getAssetRiskHistory = (id: number) =>
  axiosInstance.get<AssetRiskHistoryResponse>(`/api/assets/${id}/risk_history/`);

