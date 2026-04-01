import { Button, Group, Text } from '@mantine/core';
import { IconExternalLink, IconShield } from '@tabler/icons-react';
import type { Asset } from '../../services/assets';

type AssetLinkActionsProps = {
  linkedAsset: Asset | null;
  canSaveAsAsset: boolean;
  assetLookupLoading?: boolean;
  onOpenLinkedAsset: (asset: Asset) => void;
  onSaveAsAsset: () => void;
};

export default function AssetLinkActions({
  linkedAsset,
  canSaveAsAsset,
  assetLookupLoading = false,
  onOpenLinkedAsset,
  onSaveAsAsset,
}: AssetLinkActionsProps) {
  if (!linkedAsset && !canSaveAsAsset && !assetLookupLoading) {
    return null;
  }

  return (
    <Group gap="sm">
      {linkedAsset ? (
        <Button
          variant="light"
          onClick={() => onOpenLinkedAsset(linkedAsset)}
          leftSection={<IconExternalLink size={16} />}
        >
          Open linked asset
        </Button>
      ) : null}
      {!linkedAsset && canSaveAsAsset ? (
        <Button variant="light" onClick={onSaveAsAsset} leftSection={<IconShield size={16} />}>
          Save as asset
        </Button>
      ) : null}
      {assetLookupLoading ? (
        <Text size="sm" c="dimmed">
          Checking asset inventory link...
        </Text>
      ) : null}
    </Group>
  );
}
