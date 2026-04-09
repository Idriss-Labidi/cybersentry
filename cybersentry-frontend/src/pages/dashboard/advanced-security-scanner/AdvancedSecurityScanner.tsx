import { Alert, Container, Stack, Tabs, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconHistory, IconShieldCheck, IconSearch } from '@tabler/icons-react';
import { GuidanceGroup, type GuidanceItem } from '../../../components/guidance/GuidanceHoverCard';
import { useNavigate } from 'react-router-dom';
import IpHistorySection from '../../../components/ip-intelligence/IpHistorySection';
import IpScanDetailsModal from '../../../components/ip-intelligence/IpScanDetailsModal';
import IpScanForm from '../../../components/ip-intelligence/IpScanForm';
import IpScanResult from '../../../components/ip-intelligence/IpScanResult';
import { useIpIntelligence } from '../../../hooks/ip-intelligence/useIpIntelligence';
import { ReverseIp } from '../../tools/ip/ReverseIp';
import type { IPReputationScanHistory } from '../../../services/ip-tools';
import { downloadReport, type ReportExportFormat } from '../../../utils/assets/assetScanExport';
import { printReport } from '../../../utils/assets/assetScanPrint';
import { createStandaloneIpScanReport } from '../../../utils/assets/assetScanReport';
import { HISTORY_PAGE_SIZE } from '../../../utils/ip-intelligence';

export const AdvancedSecurityScanner = () => {
  const navigate = useNavigate();
  const guidanceItems: GuidanceItem[] = [
    {
      label: 'What this page covers',
      title: 'IP intelligence overview',
      description:
        'This page helps you investigate a single IP address from two angles: reputation scoring and reverse IP discovery.',
      bullets: [
        'Use New Scan to assess risk, flags, geolocation, and network ownership.',
        'Use Reverse IP to see what domains are associated with the same address.',
      ],
      badge: 'IP',
    },
    {
      label: 'How to read results',
      title: 'Interpreting IP output',
      description:
        'The risk score is a triage signal, not a final verdict. Combine it with flags, ASN, ISP, and reverse DNS context.',
      bullets: [
        'High risk usually means suspicious infrastructure or abuse indicators.',
        'Proxy, hosting, and mobile flags explain why a score may be elevated.',
        'History helps you spot drift or repeated suspicious observations.',
      ],
    },
  ];
  const {
    ipInput,
    ipResult,
    loading,
    error,
    historyLoading,
    historyError,
    scans,
    selectedScan,
    detailsModalOpened,
    linkedAsset,
    assetDefaults,
    assetLookupLoading,
    selectedScanLinkedAsset,
    selectedScanAssetDefaults,
    selectedScanAssetLookupLoading,
    canLoadMoreHistory,
    deletingScanId,
    setIpInput,
    setDetailsModalOpened,
    setHistoryLimit,
    handleIpCheck,
    handleViewDetails,
    handleDeleteScan,
    handleSaveAsAsset,
    handleSaveSelectedScanAsAsset,
  } = useIpIntelligence();

  const handleReportAction = (scan: IPReputationScanHistory, action: 'print' | ReportExportFormat) => {
    try {
      const report = createStandaloneIpScanReport(scan);

      if (action === 'print') {
        printReport(report);
        return;
      }

      downloadReport(report, action);
    } catch {
      notifications.show({
        color: 'red',
        title: 'Report action failed',
        message: `The IP scan report could not be ${action === 'print' ? 'opened for printing' : `exported as ${action.toUpperCase()}`}.`,
      });
    }
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <div>
          <Title order={2} mb={4}>
            <IconShieldCheck size={28} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            IP Intelligence
          </Title>
          <Text c="dimmed" fz="sm">
            Run IP reputation checks, investigate reverse IP data, review historical scans, and link results to managed assets.
          </Text>
          <GuidanceGroup items={guidanceItems} />
        </div>

        <Tabs defaultValue="scan">
          <Tabs.List>
            <Tabs.Tab value="scan" leftSection={<IconSearch size={16} />}>
              New Scan
            </Tabs.Tab>
            <Tabs.Tab value="reverse-ip" leftSection={<IconSearch size={16} />}>
              Reverse IP
            </Tabs.Tab>
            <Tabs.Tab value="history" leftSection={<IconHistory size={16} />}>
              History
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="scan" pt="xl">
            <Stack gap="lg">
              <IpScanForm
                ipInput={ipInput}
                loading={loading}
                onIpInputChange={setIpInput}
                onCheck={() => void handleIpCheck()}
              />

              {error ? (
                <Alert icon={<IconAlertCircle size={18} />} color="red" title="Error" variant="light">
                  {error}
                </Alert>
              ) : null}

              {ipResult ? (
                <IpScanResult
                  result={ipResult}
                  linkedAsset={linkedAsset}
                  canSaveAsAsset={!!assetDefaults}
                  assetLookupLoading={assetLookupLoading}
                  onOpenLinkedAsset={(asset) => navigate(`/dashboard/assets/${asset.id}`)}
                  onSaveAsAsset={handleSaveAsAsset}
                />
              ) : null}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="reverse-ip" pt="xl">
            <ReverseIp embedded />
          </Tabs.Panel>

          <Tabs.Panel value="history" pt="xl">
            <IpHistorySection
              scans={scans}
              historyLoading={historyLoading}
              historyError={historyError}
              canLoadMore={canLoadMoreHistory}
              deletingScanId={deletingScanId}
              onLoadMore={() => setHistoryLimit((current) => current + HISTORY_PAGE_SIZE)}
              onPrint={(scan) => handleReportAction(scan, 'print')}
              onExport={handleReportAction}
              onViewDetails={handleViewDetails}
              onDelete={(scanId) => void handleDeleteScan(scanId)}
            />
          </Tabs.Panel>

          
        </Tabs>
      </Stack>

      <IpScanDetailsModal
        opened={detailsModalOpened}
        scan={selectedScan}
        linkedAsset={selectedScanLinkedAsset}
        assetDefaults={selectedScanAssetDefaults}
        assetLookupLoading={selectedScanAssetLookupLoading}
        onOpenLinkedAsset={(asset) => navigate(`/dashboard/assets/${asset.id}`)}
        onSaveAsAsset={handleSaveSelectedScanAsAsset}
        onClose={() => setDetailsModalOpened(false)}
      />
    </Container>
  );
};
