import { useEffect, useState } from 'react';
import {
  Container,
  Modal,
  Stack,
  Text,
  Title,
  Tabs,
} from '@mantine/core';
import {
  IconFileText,
  IconFingerprint,
  IconHistory,
  IconMailCheck,
  IconSearch,
  IconShieldCheck,
  IconWorldWww,
} from '@tabler/icons-react';
import type { AxiosError } from 'axios';
import DnsHealthHistorySection from '../../../components/dns-intelligence/DnsHealthHistorySection';
import { GuidanceGroup, type GuidanceItem } from '../../../components/guidance/GuidanceHoverCard';
import DnsHealthResult from '../../../components/dns-intelligence/DnsHealthResult';
import { DnsHealthCheck } from '../../tools/dns/DnsHealthCheck';
import { DnsLookup } from '../../tools/dns/DnsLookup';
import { DnsPropagation } from '../../tools/dns/dns-propagation/DnsPropagation';
import { WhoisLookup } from '../../tools/domain/WhoisLookup';
import { TyposquattingDetection } from '../../tools/domain/TyposquattingDetection';
import { EmailSecurityAnalyzer } from '../../tools/email/EmailSecurityAnalyzer';
import {
  deleteDnsHealthHistoryEntry,
  getDnsHealthHistory,
  type DnsHealthHistoryEntry,
} from '../../../services/dns-tools';
import { downloadReport, type ReportExportFormat } from '../../../utils/assets/assetScanExport';
import { printReport } from '../../../utils/assets/assetScanPrint';
import { createStandaloneDnsHealthReport } from '../../../utils/assets/assetScanReport';
import { notifyError, notifySuccess } from '../../../utils/ui-notify';

export const Dns = () => {
  const guidanceItems: GuidanceItem[] = [
    {
      label: 'What this page covers',
      title: 'DNS intelligence overview',
      description:
        'This page groups the main domain and DNS investigation tools so analysts can move from raw lookup to posture review without leaving the dashboard.',
      bullets: [
        'DNS Health scores configuration quality and highlights remediation items.',
        'DNS Lookup and Propagation help verify raw records and resolver consistency.',
        'WHOIS, Typosquatting, and Email Security add ownership and abuse context.',
      ],
      badge: 'DNS',
    },
    {
      label: 'How to read results',
      title: 'Interpreting DNS output',
      description:
        'Use DNS Health for prioritization, then confirm suspicious findings with the lower-level tools before escalating.',
      bullets: [
        'A low DNS Health score usually means missing controls like SPF, DMARC, NS redundancy, or basic resolution issues.',
        'Propagation mismatches indicate resolver divergence, not always a broken zone.',
        'History shows previously saved authenticated health checks for comparison over time.',
      ],
    },
  ];
  const [history, setHistory] = useState<DnsHealthHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [selectedScan, setSelectedScan] = useState<DnsHealthHistoryEntry | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deletingScanId, setDeletingScanId] = useState<number | null>(null);

  const loadHistory = async () => {
    setHistoryLoading(true);
    setHistoryError(null);

    try {
      const response = await getDnsHealthHistory();
      setHistory(response.data.dns_health_scans);
    } catch (requestError: unknown) {
      const axiosError = requestError as AxiosError<{ error?: string }>;
      setHistoryError(axiosError.response?.data?.error ?? 'Failed to load DNS health history.');
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    void loadHistory();
  }, []);

  const handleDeleteHistoryEntry = async (scanId: number) => {
    setDeletingScanId(scanId);

    try {
      await deleteDnsHealthHistoryEntry(scanId);
      setHistory((current) => current.filter((entry) => entry.id !== scanId));
      notifySuccess('DNS scan deleted', 'The DNS health history entry was removed.');

      if (selectedScan?.id === scanId) {
        setSelectedScan(null);
        setDetailsOpen(false);
      }
    } catch {
      setHistoryError('Failed to delete DNS health scan.');
      notifyError('DNS deletion failed', 'The DNS health history entry could not be removed.');
    } finally {
      setDeletingScanId(null);
    }
  };

  const handleReportAction = (entry: DnsHealthHistoryEntry, action: 'print' | ReportExportFormat) => {
    try {
      const report = createStandaloneDnsHealthReport(entry);

      if (action === 'print') {
        printReport(report);
        return;
      }

      downloadReport(report, action);
    } catch {
      notifyError(
        'Report action failed',
        `The DNS health report could not be ${action === 'print' ? 'opened for printing' : `exported as ${action.toUpperCase()}`}.`
      );
    }
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <div>
          <Title order={2} mb={4}>
            <IconWorldWww size={28} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            DNS Intelligence
          </Title>
          <Text c="dimmed" fz="sm">
            Run domain and DNS analysis from the dashboard, then use DNS health as the score source for linked domain assets.
          </Text>
          <GuidanceGroup items={guidanceItems} />
        </div>

        <Tabs defaultValue="health">
          <Tabs.List>
            <Tabs.Tab value="health" leftSection={<IconShieldCheck size={16} />}>
              DNS Health
            </Tabs.Tab>
            <Tabs.Tab value="lookup" leftSection={<IconSearch size={16} />}>
              DNS Lookup
            </Tabs.Tab>
            <Tabs.Tab value="propagation" leftSection={<IconWorldWww size={16} />}>
              Propagation
            </Tabs.Tab>
            <Tabs.Tab value="whois" leftSection={<IconFileText size={16} />}>
              WHOIS
            </Tabs.Tab>
            <Tabs.Tab value="typosquatting" leftSection={<IconFingerprint size={16} />}>
              Typosquatting
            </Tabs.Tab>
            <Tabs.Tab value="email" leftSection={<IconMailCheck size={16} />}>
              Email Security
            </Tabs.Tab>
            <Tabs.Tab value="history" leftSection={<IconHistory size={16} />}>
              History
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="health" pt="xl">
            <DnsHealthCheck embedded />
          </Tabs.Panel>

          <Tabs.Panel value="lookup" pt="xl">
            <DnsLookup embedded />
          </Tabs.Panel>

          <Tabs.Panel value="propagation" pt="xl">
            <DnsPropagation embedded />
          </Tabs.Panel>

          <Tabs.Panel value="whois" pt="xl">
            <WhoisLookup embedded />
          </Tabs.Panel>

          <Tabs.Panel value="typosquatting" pt="xl">
            <TyposquattingDetection embedded />
          </Tabs.Panel>

          <Tabs.Panel value="email" pt="xl">
            <EmailSecurityAnalyzer embedded />
          </Tabs.Panel>

          <Tabs.Panel value="history" pt="xl">
            <DnsHealthHistorySection
              history={history}
              historyLoading={historyLoading}
              historyError={historyError}
              deletingScanId={deletingScanId}
              onRefresh={() => void loadHistory()}
              onReportAction={handleReportAction}
              onViewDetails={(entry) => {
                setSelectedScan(entry);
                setDetailsOpen(true);
              }}
              onDelete={(scanId) => void handleDeleteHistoryEntry(scanId)}
            />
          </Tabs.Panel>
        </Tabs>
      </Stack>

      <Modal
        opened={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        title={selectedScan ? selectedScan.domain_name : 'DNS health details'}
        size="xl"
      >
        {selectedScan ? (
          <DnsHealthResult result={selectedScan} scoreLabel="DNS Health Score" />
        ) : null}
      </Modal>
    </Container>
  );
};
