// Utility functions for GitHub Health Check feature

export const getRiskColor = (score: number): string => {
  if (score < 25) return 'green';
  if (score < 50) return 'yellow';
  if (score < 75) return 'orange';
  return 'red';
};

export const getRiskLabel = (score: number): string => {
  if (score < 25) return 'Low Risk';
  if (score < 50) return 'Medium Risk';
  if (score < 75) return 'High Risk';
  return 'Critical Risk';
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString();
};

export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString();
};

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

type RiskResult = {
  risk_score: number;
};

export const calculateAverageScore = (results: RiskResult[]): number => {
  if (results.length === 0) return 0;
  const total = results.reduce((sum, r) => sum + r.risk_score, 0);
  return Math.round(total / results.length);
};

export const countRiskLevels = (results: RiskResult[]) => {
  return {
    critical: results.filter((r) => r.risk_score >= 75).length,
    high: results.filter((r) => r.risk_score >= 50 && r.risk_score < 75).length,
    medium: results.filter((r) => r.risk_score >= 25 && r.risk_score < 50).length,
    low: results.filter((r) => r.risk_score < 25).length,
  };
};

