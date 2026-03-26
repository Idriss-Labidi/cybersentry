import { Alert, Button, Group, Modal, NumberInput, Select, SimpleGrid, Stack, TagsInput, TextInput, Textarea } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import type { AssetCategory, AssetStatus, AssetType } from '../../services/assets';
import {
  assetTypeOptions,
  categoryOptions,
  statusOptions,
  type AssetFormErrors,
  type AssetFormState,
} from '../../utils/assets/assetForm';

type AssetFormModalProps = {
  opened: boolean;
  editingAssetId: number | null;
  form: AssetFormState;
  formErrors: AssetFormErrors;
  assetTypeConfig: {
    namePlaceholder: string;
    valuePlaceholder: string;
    valueDescription: string;
  };
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onUpdateForm: <K extends keyof AssetFormState>(field: K, value: AssetFormState[K]) => void;
};

export default function AssetFormModal({
  opened,
  editingAssetId,
  form,
  formErrors,
  assetTypeConfig,
  isSubmitting,
  onClose,
  onSubmit,
  onUpdateForm,
}: AssetFormModalProps) {
  const isMobile = useMediaQuery('(max-width: 48em)');

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={editingAssetId ? 'Edit asset' : 'Add asset'}
      size="lg"
      fullScreen={!!isMobile}
    >
      <Stack gap="lg">
        <Alert variant="light" color="blue" title="Input guidance">
          {assetTypeConfig.valueDescription}
        </Alert>

        <TextInput
          label="Asset name"
          placeholder={assetTypeConfig.namePlaceholder}
          value={form.name}
          error={formErrors.name}
          onChange={(event) => onUpdateForm('name', event.currentTarget.value)}
          required
        />

        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <Select
            label="Asset type"
            data={assetTypeOptions}
            value={form.asset_type}
            onChange={(value) => onUpdateForm('asset_type', ((value as AssetType | null) ?? form.asset_type))}
            allowDeselect={false}
          />
          <Select
            label="Category"
            data={categoryOptions}
            value={form.category}
            onChange={(value) => onUpdateForm('category', ((value as AssetCategory | null) ?? form.category))}
            allowDeselect={false}
          />
        </SimpleGrid>

        <TextInput
          label="Asset value"
          placeholder={assetTypeConfig.valuePlaceholder}
          description={assetTypeConfig.valueDescription}
          value={form.value}
          error={formErrors.value}
          onChange={(event) => onUpdateForm('value', event.currentTarget.value)}
          required
          spellCheck={false}
        />

        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <Select
            label="Status"
            data={statusOptions}
            value={form.status}
            onChange={(value) => onUpdateForm('status', ((value as AssetStatus | null) ?? form.status))}
            allowDeselect={false}
          />
          <NumberInput
            label="Initial risk"
            description="Manual baseline for now. Automated scoring will be introduced in the next phase."
            min={0}
            max={100}
            clampBehavior="strict"
            value={form.risk_score}
            error={formErrors.risk_score}
            onChange={(value) => onUpdateForm('risk_score', typeof value === 'number' ? value : 0)}
          />
        </SimpleGrid>

        <TagsInput
          label="Tags"
          placeholder="Press Enter after each tag"
          value={form.tags}
          onChange={(value) => onUpdateForm('tags', value)}
          description="Use short labels like critical, external, customer-facing, or internal."
        />

        <Textarea
          label="Description"
          minRows={4}
          placeholder="Add operational context, ownership notes, or why this asset matters."
          value={form.description}
          onChange={(event) => onUpdateForm('description', event.currentTarget.value)}
        />

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSubmit} loading={isSubmitting}>
            {editingAssetId ? 'Save changes' : 'Create asset'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
