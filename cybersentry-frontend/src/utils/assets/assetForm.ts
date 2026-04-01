import type {
  AssetCategory,
  AssetPayload,
  AssetStatus,
  AssetSummaryResponse,
  AssetType,
} from '../../services/assets';

export const assetTypeOptions = [
  { value: 'domain', label: 'Domain' },
  { value: 'ip', label: 'IP' },
  { value: 'website', label: 'Website' },
  { value: 'github_repo', label: 'GitHub Repository' },
] as const;

export const categoryOptions = [
  { value: 'production', label: 'Production' },
  { value: 'development', label: 'Development' },
  { value: 'test', label: 'Test' },
] as const;

export const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'archived', label: 'Archived' },
] as const;

export const assetTypeMeta: Record<
  AssetType,
  {
    namePlaceholder: string;
    valuePlaceholder: string;
    valueDescription: string;
  }
> = {
  domain: {
    namePlaceholder: 'Primary domain',
    valuePlaceholder: 'example.com',
    valueDescription: 'Use the root domain you want to monitor for DNS drift and ownership changes.',
  },
  ip: {
    namePlaceholder: 'Public gateway IP',
    valuePlaceholder: '8.8.8.8',
    valueDescription: 'Use a public IPv4 or IPv6 address associated with your infrastructure.',
  },
  website: {
    namePlaceholder: 'Customer portal',
    valuePlaceholder: 'https://app.example.com',
    valueDescription: 'Use the full HTTP or HTTPS URL that should be monitored for content changes.',
  },
  github_repo: {
    namePlaceholder: 'Frontend repository',
    valuePlaceholder: 'https://github.com/owner/repository',
    valueDescription: 'Use the full GitHub repository URL for repository health checks and history.',
  },
};

export type AssetFormState = {
  name: string;
  asset_type: AssetType;
  value: string;
  category: AssetCategory;
  status: AssetStatus;
  description: string;
  risk_score: number;
  tags: string[];
};

export type AssetFormErrors = Partial<Record<'name' | 'value' | 'risk_score', string>>;

export type AssetsLocationState = {
  prefillAsset?: Partial<AssetPayload>;
};

export const defaultFormState: AssetFormState = {
  name: '',
  asset_type: 'domain',
  value: '',
  category: 'production',
  status: 'active',
  description: '',
  risk_score: 0,
  tags: [],
};

export const emptySummary: AssetSummaryResponse = {
  total_assets: 0,
  high_risk_assets: 0,
  average_risk_score: 0,
  by_category: {
    production: 0,
    development: 0,
    test: 0,
  },
  by_type: {
    domain: 0,
    ip: 0,
    website: 0,
    github_repo: 0,
  },
};

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

export const formatDateTime = (value: string | null) => {
  if (!value) {
    return 'Not scanned yet';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not scanned yet' : date.toLocaleString();
};

export const buildPayload = (form: AssetFormState): AssetPayload => ({
  name: form.name.trim(),
  asset_type: form.asset_type,
  value: form.value.trim(),
  category: form.category,
  status: form.status,
  description: form.description.trim(),
  risk_score: Math.max(0, Math.min(100, Math.round(form.risk_score))),
  tag_names: form.tags.map((tag) => tag.trim()).filter(Boolean),
});

export const validateAssetValue = (assetType: AssetType, value: string) => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return 'Asset value is required.';
  }

  if (assetType === 'domain') {
    const domainPattern =
      /^(?=.{1,253}$)(?!-)(?:[a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,63}$/;
    return domainPattern.test(trimmedValue) ? null : 'Use a valid domain like example.com.';
  }

  if (assetType === 'ip') {
    const ipv4Pattern =
      /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
    const isIpv6 = trimmedValue.includes(':');
    return ipv4Pattern.test(trimmedValue) || isIpv6
      ? null
      : 'Use a valid IPv4 or IPv6 address.';
  }

  if (assetType === 'website') {
    try {
      const url = new URL(trimmedValue);
      return ['http:', 'https:'].includes(url.protocol)
        ? null
        : 'Use a valid HTTP or HTTPS URL.';
    } catch {
      return 'Use a valid website URL like https://app.example.com.';
    }
  }

  const githubPattern = /^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/i;
  return githubPattern.test(trimmedValue)
    ? null
    : 'Use a full GitHub repository URL like https://github.com/owner/repository.';
};

export const validateForm = (form: AssetFormState): AssetFormErrors => {
  const errors: AssetFormErrors = {};

  if (!form.name.trim()) {
    errors.name = 'Asset name is required.';
  }

  const valueError = validateAssetValue(form.asset_type, form.value);
  if (valueError) {
    errors.value = valueError;
  }

  if (form.risk_score < 0 || form.risk_score > 100) {
    errors.risk_score = 'Risk score must stay between 0 and 100.';
  }

  return errors;
};
