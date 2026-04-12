import { ActionIcon, Menu } from '@mantine/core';
import { IconDownload, IconPrinter } from '@tabler/icons-react';
import type { ReportExportFormat } from '../../utils/assets/assetScanExport';

type ReportActionButtonsProps = {
  onPrint: () => void;
  onExport: (format: ReportExportFormat) => void;
  loading?: boolean;
  printTitle?: string;
};

export const ReportActionButtons = ({
  onPrint,
  onExport,
  loading = false,
  printTitle = 'Print report',
}: ReportActionButtonsProps) => (
  <Menu shadow="md" width={190} position="bottom-end" withinPortal>
    <ActionIcon.Group>
      <ActionIcon
        variant="light"
        color="blue"
        title={printTitle}
        onClick={onPrint}
        loading={loading}
        aria-label={printTitle}
      >
        <IconPrinter size={16} />
      </ActionIcon>

      <Menu.Target>
        <ActionIcon
          variant="light"
          color="gray"
          title="Export report"
          loading={loading}
          aria-label="Export report"
        >
          <IconDownload size={16} />
        </ActionIcon>
      </Menu.Target>
    </ActionIcon.Group>

    <Menu.Dropdown>
      <Menu.Item onClick={() => onExport('csv')}>Export CSV</Menu.Item>
      <Menu.Item onClick={() => onExport('json')}>Export JSON</Menu.Item>
      <Menu.Item onClick={() => onExport('excel')}>Export Excel</Menu.Item>
    </Menu.Dropdown>
  </Menu>
);
