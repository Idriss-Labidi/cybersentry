import { Alert, Container, Stack, Tabs, Text, Title } from '@mantine/core';
import { IconAlertCircle, IconHistory, IconShieldCheck, IconSearch } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import IpHistorySection from '../../../components/ip-intelligence/IpHistorySection';
import IpScanDetailsModal from '../../../components/ip-intelligence/IpScanDetailsModal';
import IpScanForm from '../../../components/ip-intelligence/IpScanForm';
import IpScanResult from '../../../components/ip-intelligence/IpScanResult';
import { useIpIntelligence } from '../../../hooks/ip-intelligence/useIpIntelligence';
import { HISTORY_PAGE_SIZE } from '../../../utils/ip-intelligence';

export const AdvancedSecurityScanner = () => {
  const navigate = useNavigate();
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

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <div>
          <Title order={2} mb={4}>
            <IconShieldCheck size={28} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            IP Intelligence
          </Title>
          <Text c="dimmed" fz="sm">
            Run authenticated IP reputation checks, review historical scans, and link the result to a managed asset.
          </Text>
        </div>

        <Tabs defaultValue="scan">
          <Tabs.List>
            <Tabs.Tab value="scan" leftSection={<IconSearch size={16} />}>
              New Scan
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

          <Tabs.Panel value="history" pt="xl">
            <IpHistorySection
              scans={scans}
              historyLoading={historyLoading}
              historyError={historyError}
              canLoadMore={canLoadMoreHistory}
              deletingScanId={deletingScanId}
              onLoadMore={() => setHistoryLimit((current) => current + HISTORY_PAGE_SIZE)}
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
