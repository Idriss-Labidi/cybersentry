import { Badge, Code, Group, LoadingOverlay, Paper, SimpleGrid, Stack, Text } from '@mantine/core';
import type { Asset } from '../../services/assets';
import {
  formatDateTime,
  getCategoryColor,
  getRiskColor,
  getStatusColor,
} from '../../utils/assets/assetDetail';

type AssetIdentityCardProps = {
  asset: Asset;
  isLoading: boolean;
};

export const AssetIdentityCard = ({ asset, isLoading }: AssetIdentityCardProps) => (
  <Paper p="lg" radius="xl" pos="relative">
    <LoadingOverlay visible={isLoading} />

    <Stack gap="lg">
      <Group justify="space-between" align="flex-start">
        <div>
          <Text fw={800} size="lg">
            {asset.name}
          </Text>
          <Text size="sm" c="dimmed" mt={4}>
            {asset.description || 'No description has been added for this asset yet.'}
          </Text>
        </div>
        <Group gap="sm">
          <Badge variant="light">{asset.asset_type_label}</Badge>
          <Badge color={getCategoryColor(asset.category)} variant="light">
            {asset.category_label}
          </Badge>
          <Badge color={getStatusColor(asset.status)} variant="light">
            {asset.status_label}
          </Badge>
          <Badge color={getRiskColor(asset.risk_score)}>{asset.risk_score}/100</Badge>
        </Group>
      </Group>

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
        <Paper p="md" radius="lg" withBorder>
          <Text fw={700} mb="md">
            Identity
          </Text>
          <Stack gap="sm">
            <Group justify="space-between" align="flex-start">
              <Text size="sm" c="dimmed">
                Value
              </Text>
              <Code>{asset.value}</Code>
            </Group>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Created
              </Text>
              <Text>{formatDateTime(asset.created_at)}</Text>
            </Group>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Updated
              </Text>
              <Text>{formatDateTime(asset.updated_at)}</Text>
            </Group>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Last scan
              </Text>
              <Text>{formatDateTime(asset.last_scanned_at)}</Text>
            </Group>
          </Stack>
        </Paper>

        <Paper p="md" radius="lg" withBorder>
          <Text fw={700} mb="md">
            Tags and baseline risk
          </Text>
          <Stack gap="sm">
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Initial risk
              </Text>
              <Badge color={getRiskColor(asset.risk_score)}>{asset.risk_score}/100</Badge>
            </Group>
            <div>
              <Text size="sm" c="dimmed" mb={8}>
                Tags
              </Text>
              <Group gap="xs">
                {asset.tags.length > 0 ? (
                  asset.tags.map((tag) => (
                    <Badge key={tag.id} variant="dot">
                      {tag.name}
                    </Badge>
                  ))
                ) : (
                  <Text c="dimmed" size="sm">
                    No tags assigned yet.
                  </Text>
                )}
              </Group>
            </div>
          </Stack>
        </Paper>
      </SimpleGrid>
    </Stack>
  </Paper>
);
