import type {
  Asset,
  AssetDnsSnapshot,
  GitHubCheckResultDetail,
} from '../../services/assets';
import type { DnsHealthHistoryEntry } from '../../services/dns-tools';
import type { IPReputationScanHistory } from '../../services/ip-tools';
import { formatDateTime, formatDnsValues } from './assetDetail';

export type PrintableAsset = Pick<
  Asset,
  'id' | 'name' | 'asset_type' | 'asset_type_label' | 'value' | 'category_label' | 'status_label' | 'risk_score'
>;

export type ReportSection = {
  title: string;
  value: unknown;
};

export type ReportDefinition = {
  documentTitle: string;
  reportTitle: string;
  sections: ReportSection[];
};

type ToolReportContext = {
  tool: string;
  lookupValue: string;
};

const createSection = (title: string, value: unknown): ReportSection => ({
  title,
  value,
});

const createAssetSummary = (asset: PrintableAsset) => ({
  id: asset.id,
  name: asset.name,
  type: asset.asset_type_label,
  value: asset.value,
  category: asset.category_label,
  status: asset.status_label,
  baseline_risk_score: `${asset.risk_score}/100`,
});

const createToolContext = ({ tool, lookupValue }: ToolReportContext) => ({
  tool,
  lookup_value: lookupValue,
});

const createAssetSection = (asset: PrintableAsset) => createSection('Asset', createAssetSummary(asset));

const createContextSection = (context: ToolReportContext) =>
  createSection('Context', createToolContext(context));

const createIpReportSections = (
  leadSection: ReportSection,
  scan: IPReputationScanHistory,
): ReportSection[] => [
  leadSection,
  createSection('Scan overview', {
    scan_id: scan.id,
    ip_address: scan.ip_address,
    scanned_at: formatDateTime(scan.scanned_at),
    reputation_score: `${scan.reputation_score}/100`,
    risk_level: scan.risk_level,
    proxy: scan.is_proxy,
    hosting: scan.is_hosting,
    mobile: scan.is_mobile,
  }),
  createSection('Location and network', {
    geolocation: scan.geolocation,
    network: scan.network,
  }),
  createSection('Risk factors', scan.risk_factors),
  createSection('Raw scan payload', scan),
];

const createGitHubReportSections = (
  leadSection: ReportSection,
  result: GitHubCheckResultDetail,
): ReportSection[] => [
  leadSection,
  createSection('Check overview', {
    check_id: result.id,
    checked_at: formatDateTime(result.check_timestamp),
    risk_score: `${result.risk_score}/100`,
    summary: result.summary,
  }),
  createSection('Repository', {
    url: result.repository.url,
    owner: result.repository.owner,
    name: result.repository.name,
    last_repository_check: formatDateTime(result.repository.last_check_at),
  }),
  createSection('Warnings', result.warnings ?? []),
  createSection('Recommendations', result.recommendations ?? []),
  createSection('Structured findings', {
    level1_data: result.level1_data ?? null,
    level2_data: result.level2_data ?? null,
    level3_data: result.level3_data ?? null,
  }),
  createSection('Raw check payload', result),
];

const createDnsSnapshotReportSections = (
  leadSection: ReportSection,
  snapshot: AssetDnsSnapshot,
): ReportSection[] => [
  leadSection,
  createSection('Snapshot overview', {
    snapshot_id: snapshot.id,
    status: snapshot.status,
    scanned_at: formatDateTime(snapshot.scanned_at),
    error_message: snapshot.error_message || null,
    record_types: snapshot.record_types,
  }),
  createSection(
    'DNS records',
    Object.fromEntries(
      snapshot.record_types.map((recordType) => [recordType, formatDnsValues(snapshot.records[recordType])]),
    ),
  ),
  createSection('Raw snapshot payload', snapshot),
];

const createDnsHealthReportSections = (
  leadSection: ReportSection,
  entry: DnsHealthHistoryEntry,
): ReportSection[] => [
  leadSection,
  createSection('Health check overview', {
    check_id: entry.id,
    domain_name: entry.domain_name,
    scanned_at: formatDateTime(entry.scanned_at),
    score: `${entry.score}/100`,
    grade: entry.grade,
  }),
  createSection('Checks', entry.checks),
  createSection('Recommendations', entry.recommendations),
  createSection('Raw health payload', entry),
];

export const createAssetIpScanReport = (
  asset: PrintableAsset,
  scan: IPReputationScanHistory,
): ReportDefinition => ({
  documentTitle: `IP scan ${scan.id}`,
  reportTitle: 'IP Scan Report',
  sections: createIpReportSections(createAssetSection(asset), scan),
});

export const createAssetGitHubScanReport = (
  asset: PrintableAsset,
  result: GitHubCheckResultDetail,
): ReportDefinition => ({
  documentTitle: `GitHub check ${result.id}`,
  reportTitle: 'GitHub Check Report',
  sections: createGitHubReportSections(createAssetSection(asset), result),
});

export const createAssetDnsSnapshotReport = (
  asset: PrintableAsset,
  snapshot: AssetDnsSnapshot,
): ReportDefinition => ({
  documentTitle: `DNS snapshot ${snapshot.id}`,
  reportTitle: 'DNS Snapshot Report',
  sections: createDnsSnapshotReportSections(createAssetSection(asset), snapshot),
});

export const createAssetDnsHealthReport = (
  asset: PrintableAsset,
  entry: DnsHealthHistoryEntry,
): ReportDefinition => ({
  documentTitle: `DNS health ${entry.id}`,
  reportTitle: 'DNS Health Report',
  sections: createDnsHealthReportSections(createAssetSection(asset), entry),
});

export const createStandaloneIpScanReport = (scan: IPReputationScanHistory): ReportDefinition => ({
  documentTitle: `IP scan ${scan.id}`,
  reportTitle: 'IP Scan Report',
  sections: createIpReportSections(
    createContextSection({
      tool: 'IP Intelligence',
      lookupValue: scan.ip_address,
    }),
    scan,
  ),
});

export const createStandaloneGitHubScanReport = (
  result: GitHubCheckResultDetail,
): ReportDefinition => ({
  documentTitle: `GitHub check ${result.id}`,
  reportTitle: 'GitHub Check Report',
  sections: createGitHubReportSections(
    createContextSection({
      tool: 'GitHub Health',
      lookupValue: result.repository.url,
    }),
    result,
  ),
});

export const createStandaloneDnsHealthReport = (
  entry: DnsHealthHistoryEntry,
): ReportDefinition => ({
  documentTitle: `DNS health ${entry.id}`,
  reportTitle: 'DNS Health Report',
  sections: createDnsHealthReportSections(
    createContextSection({
      tool: 'DNS Intelligence',
      lookupValue: entry.domain_name,
    }),
    entry,
  ),
});
