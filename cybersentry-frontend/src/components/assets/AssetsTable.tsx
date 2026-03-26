import { ActionIcon, Badge, Group, ScrollArea, Stack, Table, Text } from '@mantine/core';
import { IconEdit, IconEye, IconTrash } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import type { Asset } from '../../services/assets';
import {
  getCategoryColor,
  getRiskColor,
  getStatusColor,
} from '../../utils/assets/assetForm';

type AssetsTableProps = {
  assets: Asset[];
  onEdit: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
};

export default function AssetsTable({ assets, onEdit, onDelete }: AssetsTableProps) {
  return (
    <ScrollArea>
      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Asset</Table.Th>
            <Table.Th>Value</Table.Th>
            <Table.Th>Type</Table.Th>
            <Table.Th>Posture</Table.Th>
            <Table.Th style={{ textAlign: 'center' }}>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {assets.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={4}>
                <Text c="dimmed">
                  No assets match the current filters. Try broadening the search or adding a new asset.
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            assets.map((asset) => (
              <Table.Tr key={asset.id}>
                <Table.Td>
                  <Stack gap={4}>
                    <Text fw={700}>{asset.name}</Text>
                    <Text size="sm" c="dimmed">
                      {asset.category_label}
                    </Text>
                  </Stack>
                </Table.Td>
                <Table.Td>
                  <Text ff="monospace" size="sm" lineClamp={1} title={asset.value}>
                    {asset.value}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Badge variant="light">{asset.asset_type_label}</Badge>
                </Table.Td>
                <Table.Td>
                  <Stack gap={6}>
                    <Group gap={6}>
                      <Badge color={getRiskColor(asset.risk_score)}>{asset.risk_score}/100</Badge>
                      <Badge color={getStatusColor(asset.status)} variant="light">
                        {asset.status_label}
                      </Badge>
                      <Badge variant="light" color={getCategoryColor(asset.category)}>
                        {asset.category_label}
                      </Badge>
                    </Group>
                  </Stack>
                </Table.Td>
                <Table.Td style={{ textAlign: 'center' }}>
                  <Group gap="xs" wrap="nowrap" justify="center">
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
                </Table.Td>
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
}
