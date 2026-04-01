import { Badge, Button, Code, Group, Modal, Paper, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconTrashX } from '@tabler/icons-react';
import type { Asset } from '../../services/assets';
import { getRiskColor } from '../../utils/assets/assetForm';

type AssetDeleteModalProps = {
  asset: Asset | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function AssetDeleteModal({
  asset,
  isDeleting,
  onClose,
  onConfirm,
}: AssetDeleteModalProps) {
  return (
    <Modal opened={!!asset} onClose={onClose} title="Delete asset" size="md" centered>
      <Stack gap="lg">
        <Group gap="sm" align="flex-start">
          <ThemeIcon color="red" variant="light" size={44} radius="xl">
            <IconTrashX size={22} />
          </ThemeIcon>
          <div>
            <Text fw={800}>This action cannot be undone.</Text>
            <Text size="sm" c="dimmed" mt={4}>
              The asset will be removed from the inventory and any future dashboard workflows built on top of it.
            </Text>
          </div>
        </Group>

        {asset ? (
          <Paper p="md" radius="lg" withBorder>
            <Stack gap="sm">
              <Group justify="space-between">
                <Text c="dimmed" size="sm">
                  Asset
                </Text>
                <Text fw={700}>{asset.name}</Text>
              </Group>
              <Group justify="space-between">
                <Text c="dimmed" size="sm">
                  Type
                </Text>
                <Badge variant="light">{asset.asset_type_label}</Badge>
              </Group>
              <Group justify="space-between" align="flex-start">
                <Text c="dimmed" size="sm">
                  Value
                </Text>
                <Code>{asset.value}</Code>
              </Group>
              <Group justify="space-between">
                <Text c="dimmed" size="sm">
                  Risk
                </Text>
                <Badge color={getRiskColor(asset.risk_score)}>{asset.risk_score}/100</Badge>
              </Group>
            </Stack>
          </Paper>
        ) : null}

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button color="red" onClick={onConfirm} loading={isDeleting}>
            Delete asset
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
