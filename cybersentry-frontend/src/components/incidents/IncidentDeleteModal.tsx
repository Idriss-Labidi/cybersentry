import { Alert, Button, Group, Modal, Stack, Text } from '@mantine/core';
import type { IncidentTicket } from '../../services/incidents';

type IncidentDeleteModalProps = {
  incident: IncidentTicket | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function IncidentDeleteModal({
  incident,
  isDeleting,
  onClose,
  onConfirm,
}: IncidentDeleteModalProps) {
  return (
    <Modal opened={!!incident} onClose={onClose} title="Delete incident ticket" centered>
      <Stack gap="md">
        <Alert color="red" variant="light" title="This action cannot be undone">
          Deleting this ticket removes all manual context saved on it.
        </Alert>

        <Text>
          Confirm deletion of <strong>{incident?.title ?? 'this incident'}</strong>?
        </Text>

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button color="red" onClick={onConfirm} loading={isDeleting}>
            Delete ticket
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

