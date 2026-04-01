import { Alert, Paper, Text } from '@mantine/core';

type AssetAutomationPlaceholderProps = {
  message?: string | null;
};

export const AssetAutomationPlaceholder = ({ message }: AssetAutomationPlaceholderProps) => (
  <Paper p="lg" radius="xl">
    <Text fw={800} mb="sm">
      Related intelligence
    </Text>
    <Alert color="blue" variant="light" title="Next automation target">
      {message ||
        'This asset type is already inventoried, but automated DNS and website monitoring will be added in the next phase.'}
    </Alert>
  </Paper>
);
