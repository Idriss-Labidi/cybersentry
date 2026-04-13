import { ActionIcon, Badge, Group, Paper, ScrollArea, Stack, Text } from '@mantine/core';
import { IconEdit, IconEye, IconTrash } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import type { Asset, AssetType } from '../../services/assets';
import { getCategoryColor, getRiskColor, getStatusColor } from '../../utils/assets/assetForm';
import { formatRelativeTime, getAssetTypeLabel } from '../../utils/dashboard/overview';

type AssetsBoardViewProps = {
  assets: Asset[];
  onEdit: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
};

const BOARD_COLUMNS: AssetType[] = ['domain', 'ip', 'website', 'github_repo'];

export default function AssetsBoardView({ assets, onEdit, onDelete }: AssetsBoardViewProps) {
  return (
    <ScrollArea>
      <Group align="flex-start" gap="md" wrap="nowrap">
        {BOARD_COLUMNS.map((assetType) => {
          const columnAssets = assets
            .filter((asset) => asset.asset_type === assetType)
            .sort((left, right) => right.risk_score - left.risk_score || left.name.localeCompare(right.name));

          return (
            <Paper key={assetType} p="md" radius="lg" withBorder style={{ minWidth: 280, width: 280 }}>
              <Stack gap="md">
                <Group justify="space-between" align="center">
                  <Text fw={700}>{getAssetTypeLabel(assetType)}</Text>
                  <Badge variant="light">{columnAssets.length}</Badge>
                </Group>

                <Stack gap="sm">
                  {columnAssets.length === 0 ? (
                    <Text size="sm" c="dimmed">
                      No assets in this view.
                    </Text>
                  ) : (
                    columnAssets.map((asset) => (
                      <Paper key={asset.id} p="sm" radius="md" withBorder>
                        <Stack gap="sm">
                          <Group justify="space-between" align="flex-start" wrap="nowrap">
                            <div>
                              <Text fw={700}>{asset.name}</Text>
                              <Text size="xs" c="dimmed" ff="monospace" lineClamp={2} title={asset.value}>
                                {asset.value}
                              </Text>
                            </div>
                            <Badge color={getRiskColor(asset.risk_score)}>{asset.risk_score}/100</Badge>
                          </Group>

                          <Group gap={6}>
                            <Badge variant="light" color={getCategoryColor(asset.category)}>
                              {asset.category_label}
                            </Badge>
                            <Badge variant="light" color={getStatusColor(asset.status)}>
                              {asset.status_label}
                            </Badge>
                          </Group>

                          <Text size="xs" c="dimmed">
                            {asset.last_scanned_at ? `Last scan ${formatRelativeTime(asset.last_scanned_at)}` : 'No scan recorded yet'}
                          </Text>

                          <Group gap="xs" justify="flex-end">
                            <ActionIcon
                              component={Link}
                              to={`/dashboard/assets/${asset.id}`}
                              variant="light"
                              aria-label={`View ${asset.name}`}
                            >
                              <IconEye size={16} />
                            </ActionIcon>
                            <ActionIcon variant="light" onClick={() => onEdit(asset)} aria-label={`Edit ${asset.name}`}>
                              <IconEdit size={16} />
                            </ActionIcon>
                            <ActionIcon
                              variant="light"
                              color="red"
                              onClick={() => onDelete(asset)}
                              aria-label={`Delete ${asset.name}`}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Group>
                        </Stack>
                      </Paper>
                    ))
                  )}
                </Stack>
              </Stack>
            </Paper>
          );
        })}
      </Group>
    </ScrollArea>
  );
}
