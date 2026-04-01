import type {
  AssetCategory,
  AssetRiskHistoryEntry,
  AssetStatus,
} from '../../services/assets';

export const getRiskColor = (score: number) => {
  if (score >= 70) {
    return 'red';
  }

  if (score >= 40) {
    return 'yellow';
  }

  return 'green';
};

export const getCategoryColor = (category: AssetCategory) => {
  if (category === 'production') {
    return 'red';
  }

  if (category === 'development') {
    return 'blue';
  }

  return 'gray';
};

export const getStatusColor = (status: AssetStatus) => {
  if (status === 'active') {
    return 'green';
  }

  if (status === 'paused') {
    return 'yellow';
  }

  return 'gray';
};

export const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
  if (severity === 'high') {
    return 'red';
  }

  if (severity === 'medium') {
    return 'yellow';
  }

  return 'blue';
};

export const getDnsStatusColor = (status: 'success' | 'failed') =>
  status === 'success' ? 'green' : 'red';

export const formatDateTime = (value: string | null | undefined) => {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleString();
};

export const formatDnsValues = (values: string[] | null | undefined) => {
  if (!values || values.length === 0) {
    return 'No records';
  }

  return values.join(', ');
};

export const riskSourceLabel = (entry: AssetRiskHistoryEntry) =>
  entry.note || entry.source || 'Snapshot';
