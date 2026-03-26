import { Button, Group, LoadingOverlay, Paper, TextInput } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

type IpScanFormProps = {
  ipInput: string;
  loading: boolean;
  onIpInputChange: (value: string) => void;
  onCheck: () => void;
};

export default function IpScanForm({
  ipInput,
  loading,
  onIpInputChange,
  onCheck,
}: IpScanFormProps) {
  return (
    <Paper withBorder p="lg" radius="md" pos="relative">
      <LoadingOverlay visible={loading} />
      <Group align="end">
        <TextInput
          label="IP Address"
          placeholder="8.8.8.8"
          value={ipInput}
          onChange={(event) => onIpInputChange(event.currentTarget.value)}
          onKeyDown={(event) => event.key === 'Enter' && onCheck()}
          size="md"
          style={{ flex: 1 }}
        />
        <Button
          leftSection={<IconSearch size={18} />}
          onClick={onCheck}
          disabled={!ipInput.trim()}
          size="md"
        >
          Check Reputation
        </Button>
      </Group>
    </Paper>
  );
}
