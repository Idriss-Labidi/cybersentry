import type {
  AssetDnsSnapshot,
  GitHubCheckResultDetail,
} from '../../services/assets';
import type { DnsHealthHistoryEntry } from '../../services/dns-tools';
import type { IPReputationScanHistory } from '../../services/ip-tools';
import {
  createAssetDnsHealthReport,
  createAssetDnsSnapshotReport,
  createAssetGitHubScanReport,
  createAssetIpScanReport,
  createStandaloneDnsHealthReport,
  createStandaloneGitHubScanReport,
  createStandaloneIpScanReport,
  type PrintableAsset,
  type ReportDefinition,
  type ReportSection,
} from './assetScanReport';

const PRINT_STYLES = `
  :root {
    color-scheme: light;
    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    padding: 32px;
    color: #102033;
    background: #f5f7fb;
  }

  main {
    max-width: 1040px;
    margin: 0 auto;
  }

  header {
    margin-bottom: 24px;
    padding: 24px;
    border: 1px solid #d7e0ea;
    border-radius: 16px;
    background: linear-gradient(135deg, #ffffff 0%, #eef5fb 100%);
  }

  h1 {
    margin: 0 0 10px;
    font-size: 28px;
  }

  h2 {
    margin: 0 0 14px;
    font-size: 18px;
  }

  p {
    margin: 0;
    line-height: 1.6;
  }

  .meta {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
    margin-top: 16px;
  }

  .meta-card {
    padding: 12px 14px;
    border-radius: 12px;
    background: rgba(16, 32, 51, 0.04);
  }

  .meta-label {
    display: block;
    margin-bottom: 4px;
    color: #53687d;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .report-section {
    margin-bottom: 18px;
    padding: 20px;
    border: 1px solid #d7e0ea;
    border-radius: 16px;
    background: #ffffff;
    break-inside: avoid;
  }

  .kv-table {
    width: 100%;
    border-collapse: collapse;
  }

  .kv-table th,
  .kv-table td {
    padding: 10px 12px;
    border-top: 1px solid #e5ebf2;
    text-align: left;
    vertical-align: top;
  }

  .kv-table tr:first-child th,
  .kv-table tr:first-child td {
    border-top: none;
  }

  .kv-table th {
    width: 240px;
    color: #53687d;
    font-size: 13px;
    font-weight: 700;
  }

  ul {
    margin: 0;
    padding-left: 18px;
  }

  li + li {
    margin-top: 6px;
  }

  .nested-card {
    margin-top: 10px;
    padding: 12px;
    border: 1px solid #e5ebf2;
    border-radius: 12px;
    background: #f9fbfd;
  }

  .nested-card:first-child {
    margin-top: 0;
  }

  .nested-label {
    margin-bottom: 10px;
    color: #53687d;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .muted {
    color: #73869b;
  }

  @media print {
    body {
      padding: 0;
      background: #ffffff;
    }

    header,
    .report-section {
      border-color: #d7e0ea;
      box-shadow: none;
    }
  }
`;

const AUTO_PRINT_SCRIPT = `
  window.addEventListener('load', () => {
    window.setTimeout(() => {
      window.focus();
      window.print();
    }, 150);
  }, { once: true });
`;

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const humanizeKey = (value: string) =>
  value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());

const formatPrimitive = (value: string | number | boolean | null | undefined) => {
  if (value === null || value === undefined || value === '') {
    return '<span class="muted">Not available</span>';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  return typeof value === 'number' ? String(value) : escapeHtml(value);
};

const renderPrimitiveList = (values: Array<string | number | boolean | null>) =>
  `<ul>${values.map((entry) => `<li>${formatPrimitive(entry)}</li>`).join('')}</ul>`;

const renderObjectTable = (value: Record<string, unknown>) => {
  const entries = Object.entries(value);
  if (entries.length === 0) {
    return '<span class="muted">No data</span>';
  }

  return `
    <table class="kv-table">
      <tbody>
        ${entries
          .map(
            ([key, entryValue]) => `
              <tr>
                <th>${escapeHtml(humanizeKey(key))}</th>
                <td>${renderValue(entryValue)}</td>
              </tr>
            `,
          )
          .join('')}
      </tbody>
    </table>
  `;
};

const renderArray = (value: unknown[]) => {
  if (value.length === 0) {
    return '<span class="muted">None</span>';
  }

  if (value.every((entry) => entry === null || ['string', 'number', 'boolean'].includes(typeof entry))) {
    return renderPrimitiveList(value as Array<string | number | boolean | null>);
  }

  return value
    .map(
      (entry, index) => `
        <div class="nested-card">
          <div class="nested-label">Item ${index + 1}</div>
          ${renderValue(entry)}
        </div>
      `,
    )
    .join('');
};

const renderValue = (value: unknown): string => {
  if (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return formatPrimitive(value);
  }

  if (Array.isArray(value)) {
    return renderArray(value);
  }

  return renderObjectTable(value as Record<string, unknown>);
};

const renderSections = (sections: ReportSection[]) =>
  sections
    .map(
      (section) => `
        <section class="report-section">
          <h2>${escapeHtml(section.title)}</h2>
          ${renderValue(section.value)}
        </section>
      `,
    )
    .join('');

const buildReportHtml = ({ documentTitle, reportTitle, sections }: ReportDefinition) => `
  <!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${escapeHtml(documentTitle)}</title>
      <style>${PRINT_STYLES}</style>
      <script>${AUTO_PRINT_SCRIPT}</script>
    </head>
    <body>
      <main>
        <header>
          <h1>${escapeHtml(reportTitle)}</h1>
          <p>Generated from CyberSentry report data. Use the browser print dialog to print or save this report as PDF.</p>
          <div class="meta">
            <div class="meta-card">
              <span class="meta-label">Generated</span>
              ${escapeHtml(new Date().toLocaleString())}
            </div>
            <div class="meta-card">
              <span class="meta-label">Report</span>
              ${escapeHtml(documentTitle)}
            </div>
          </div>
        </header>
        ${renderSections(sections)}
      </main>
    </body>
  </html>
`;

const revokePrintUrlLater = (printUrl: string) => {
  window.setTimeout(() => {
    URL.revokeObjectURL(printUrl);
  }, 60000);
};

export const printReport = (report: ReportDefinition) => {
  const html = buildReportHtml(report);
  const blob = new Blob([html], { type: 'text/html' });
  const printUrl = URL.createObjectURL(blob);
  const printWindow = window.open(printUrl, '_blank', 'width=1200,height=900');

  if (!printWindow) {
    URL.revokeObjectURL(printUrl);
    throw new Error('The print preview window was blocked by the browser.');
  }

  revokePrintUrlLater(printUrl);
};

export const printIpScanReport = (asset: PrintableAsset, scan: IPReputationScanHistory) => {
  printReport(createAssetIpScanReport(asset, scan));
};

export const printGitHubScanReport = (asset: PrintableAsset, result: GitHubCheckResultDetail) => {
  printReport(createAssetGitHubScanReport(asset, result));
};

export const printDnsSnapshotReport = (asset: PrintableAsset, snapshot: AssetDnsSnapshot) => {
  printReport(createAssetDnsSnapshotReport(asset, snapshot));
};

export const printDnsHealthReport = (asset: PrintableAsset, entry: DnsHealthHistoryEntry) => {
  printReport(createAssetDnsHealthReport(asset, entry));
};

export const printStandaloneIpScanReport = (scan: IPReputationScanHistory) => {
  printReport(createStandaloneIpScanReport(scan));
};

export const printStandaloneGitHubScanReport = (result: GitHubCheckResultDetail) => {
  printReport(createStandaloneGitHubScanReport(result));
};

export const printStandaloneDnsHealthReport = (entry: DnsHealthHistoryEntry) => {
  printReport(createStandaloneDnsHealthReport(entry));
};
