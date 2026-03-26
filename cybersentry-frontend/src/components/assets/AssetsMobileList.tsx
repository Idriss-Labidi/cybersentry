import { ActionIcon, Badge, Group, Paper, Stack, Text } from '@mantine/core';
import { IconEdit, IconEye, IconTrash } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import type { Asset } from '../../services/assets';
import {
  getCategoryColor,
  getRiskColor,
  getStatusColor,
} from '../../utils/assets/assetForm';

type AssetsMobileListProps = {
  assets: Asset[];
  onEdit: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
};

export default function AssetsMobileList({ assets, onEdit, onDelete }: AssetsMobileListProps) {
  return (
    <Stack gap="md">
      {assets.length === 0 ? (
        <Paper p="lg" radius="lg" withBorder>
          <Text c="dimmed">
            No assets match the current filters. Try broadening the search or adding a new asset.
          </Text>
        </Paper>
      ) : (
        assets.map((asset) => (
          <Paper key={asset.id} p="md" radius="lg" withBorder>
            <Stack gap="sm">
              <Group justify="space-between" align="flex-start">
                <div>
                  <Text fw={800}>{asset.name}</Text>
                  <Text size="sm" c="dimmed" mt={4}>
                    {asset.category_label}
                  </Text>
                </div>
                <Group gap="xs" wrap="wrap" justify="flex-end">
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
              </Group>

              <Text ff="monospace" size="sm" lineClamp={1}>
                {asset.value}
              </Text>

              <Group gap={6}>
                <Badge variant="light">{asset.asset_type_label}</Badge>
                <Badge variant="light" color={getCategoryColor(asset.category)}>
                  {asset.category_label}
                </Badge>
                <Badge color={getRiskColor(asset.risk_score)}>{asset.risk_score}/100</Badge>
                <Badge variant="light" color={getStatusColor(asset.status)}>
                  {asset.status_label}
                </Badge>
              </Group>
            </Stack>
          </Paper>
        ))
      )}
    </Stack>
  );
}
