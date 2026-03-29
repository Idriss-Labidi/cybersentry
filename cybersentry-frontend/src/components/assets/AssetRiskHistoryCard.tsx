import { Badge, Group, LoadingOverlay, Paper, Stack, Text } from '@mantine/core';
import type { AssetRiskHistoryEntry } from '../../services/assets';
import { formatDateTime, getRiskColor, riskSourceLabel } from '../../utils/assets/assetDetail';

type AssetRiskHistoryCardProps = {
  riskHistory: AssetRiskHistoryEntry[];
  isLoading: boolean;
};

export const AssetRiskHistoryCard = ({ riskHistory, isLoading }: AssetRiskHistoryCardProps) => (
  <Paper p="lg" radius="xl" pos="relative">
    <LoadingOverlay visible={isLoading} />
    <Group justify="space-between" align="flex-start" mb="md">
      <div>
        <Text fw={800}>Risk history</Text>
        <Text size="sm" c="dimmed" mt={4}>
          The current score remains a manual baseline for this phase, but every change is still tracked over time.
        </Text>
      </div>
      <Badge variant="light">{riskHistory.length} entries</Badge>
    </Group>

    {riskHistory.length === 0 ? (
      <Text c="dimmed">No risk snapshots recorded yet for this asset.</Text>
    ) : (
      <Stack gap="sm">
        {riskHistory.map((entry) => (
          <Paper key={entry.id} p="md" radius="lg" withBorder>
            <Group justify="space-between" align="flex-start">
              <div>
                <Text fw={700}>{riskSourceLabel(entry)}</Text>
                <Text size="sm" c="dimmed" mt={4}>
                  {formatDateTime(entry.calculated_at)}
                </Text>
              </div>
              <Badge color={getRiskColor(entry.score)}>{entry.score}/100</Badge>
            </Group>
          </Paper>
        ))}
      </Stack>
    )}
  </Paper>
);
