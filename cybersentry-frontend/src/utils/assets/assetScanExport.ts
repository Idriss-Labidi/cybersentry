import type { ReportDefinition } from './assetScanReport';

export type ReportExportFormat = 'csv' | 'json' | 'excel';

type FlattenedReportRow = {
  section: string;
  field: string;
  value: string;
};

const escapeXml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const csvEscape = (value: string) => `"${value.replaceAll('"', '""')}"`;

const toFileSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'report';

const stringifyScalar = (value: string | number | boolean | null | undefined) => {
  if (value === null || value === undefined) {
    return '';
  }

  return typeof value === 'string' ? value : String(value);
};

const flattenValue = (value: unknown, path = 'value'): Array<Pick<FlattenedReportRow, 'field' | 'value'>> => {
  if (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return [{ field: path, value: stringifyScalar(value) }];
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return [{ field: path, value: '' }];
    }

    return value.flatMap((entry, index) => flattenValue(entry, `${path}[${index}]`));
  }

  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) {
    return [{ field: path, value: '' }];
  }

  return entries.flatMap(([key, entryValue]) => {
    const nextPath = path === 'value' ? key : `${path}.${key}`;
    return flattenValue(entryValue, nextPath);
  });
};

const flattenReport = (report: ReportDefinition): FlattenedReportRow[] =>
  report.sections.flatMap((section) =>
    flattenValue(section.value).map((row) => ({
      section: section.title,
      field: row.field,
      value: row.value,
    })),
  );

const downloadFile = (content: BlobPart, mimeType: string, filename: string) => {
  const blob = new Blob([content], { type: mimeType });
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = downloadUrl;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(downloadUrl);
  }, 60000);
};

const createCsvContent = (report: ReportDefinition) => {
  const rows = flattenReport(report);
  const header = ['Section', 'Field', 'Value'].map(csvEscape).join(',');
  const body = rows
    .map((row) => [row.section, row.field, row.value].map(csvEscape).join(','))
    .join('\n');

  return `${header}\n${body}`;
};

const createJsonContent = (report: ReportDefinition) =>
  JSON.stringify(
    {
      document_title: report.documentTitle,
      report_title: report.reportTitle,
      exported_at: new Date().toISOString(),
      sections: report.sections,
    },
    null,
    2,
  );

const createExcelContent = (report: ReportDefinition) => {
  const rows = flattenReport(report);
  const headers = ['Section', 'Field', 'Value'];
  const sheetRows = [headers, ...rows.map((row) => [row.section, row.field, row.value])];

  const xmlRows = sheetRows
    .map(
      (row) => `
        <Row>
          ${row
            .map(
              (cell) => `
                <Cell>
                  <Data ss:Type="String">${escapeXml(cell)}</Data>
                </Cell>
              `,
            )
            .join('')}
        </Row>
      `,
    )
    .join('');

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook
  xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:html="http://www.w3.org/TR/REC-html40"
>
  <Worksheet ss:Name="Report">
    <Table>
      ${xmlRows}
    </Table>
  </Worksheet>
</Workbook>`;
};

export const downloadReportAsCsv = (report: ReportDefinition) => {
  downloadFile(createCsvContent(report), 'text/csv;charset=utf-8', `${toFileSlug(report.documentTitle)}.csv`);
};

export const downloadReportAsJson = (report: ReportDefinition) => {
  downloadFile(createJsonContent(report), 'application/json;charset=utf-8', `${toFileSlug(report.documentTitle)}.json`);
};

export const downloadReportAsExcel = (report: ReportDefinition) => {
  downloadFile(createExcelContent(report), 'application/vnd.ms-excel', `${toFileSlug(report.documentTitle)}.xls`);
};

export const downloadReport = (report: ReportDefinition, format: ReportExportFormat) => {
  switch (format) {
    case 'csv':
      downloadReportAsCsv(report);
      return;
    case 'json':
      downloadReportAsJson(report);
      return;
    case 'excel':
      downloadReportAsExcel(report);
      return;
  }
};
