export interface RepositoryInfo {
  id: number;
  owner: string;
  name: string;
  url: string;
  organization: number;
  created_at: string;
  last_check_at: string | null;
}

export interface WarningItem {
  level: string;
  message: string;
  category: string;
}

export interface CheckResultDetail {
  id: number;
  repository: RepositoryInfo;
  risk_score: number;
  level1_data?: {
    raw_metrics?: { stars?: number; forks?: number; open_issues?: number; language?: string };
    community?: { total_contributors?: number };
    maintenance?: { status?: string; last_push_date?: string; days_since_last_commit?: number };
  };
  level2_data?: {
    dependencies?: Record<string, string>;
    security_file_check?: Record<string, { exists: boolean; size_bytes: number }>;
    code_quality_signals?: { suspicious_code_patterns?: string[] };
  };
  level3_data?: {
    code_scanning?: { available?: boolean };
    secret_scanning?: { available?: boolean };
    dependabot_alerts?: { available?: boolean; error?: string };
  };
  summary: string;
  warnings?: WarningItem[];
  recommendations?: string[];
  check_timestamp: string;
}

export interface CheckResponse {
  message?: string;
  result: CheckResultDetail;
}

export interface HistorySummary {
  id: number;
  repository_url: string;
  repository_name: string;
  risk_score: number;
  summary: string;
  check_timestamp: string;
  repository: {
    owner: string;
    name: string;
    url: string;
  };
}

export const parseRepositoryUrl = (url?: string) => {
  const match = url?.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)/i);
  return {
    owner: match?.[1] ?? 'Unknown',
    name: match?.[2]?.replace(/\.git$/, '') ?? 'Unknown',
  };
};

export const normalizeHistoryEntry = (entry: Omit<HistorySummary, 'repository'>): HistorySummary => ({
  ...entry,
  repository: {
    ...parseRepositoryUrl(entry.repository_url),
    url: entry.repository_url,
  },
});

export const formatGitHubHealthDate = (value?: string | null) => {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleString();
};
