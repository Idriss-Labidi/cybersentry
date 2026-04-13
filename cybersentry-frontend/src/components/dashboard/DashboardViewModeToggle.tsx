import type { ReactNode } from 'react';
import { Group, SegmentedControl, Text } from '@mantine/core';

export type DashboardViewModeOption = {
  label: string;
  value: string;
  leftSection?: ReactNode;
};

type DashboardViewModeToggleProps = {
  value: string;
  onChange: (value: string) => void;
  options: DashboardViewModeOption[];
  label?: string;
};

export function DashboardViewModeToggle({
  value,
  onChange,
  options,
  label = 'View:',
}: DashboardViewModeToggleProps) {
  const data = options.map((option) => ({
    value: option.value,
    label: option.leftSection ? (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        {option.leftSection}
        <span>{option.label}</span>
      </span>
    ) : (
      option.label
    ),
  }));

  return (
    <Group gap="sm" align="center" wrap="wrap">
      <Text size="sm" fw={500}>
        {label}
      </Text>
      <SegmentedControl value={value} onChange={onChange} data={data} />
    </Group>
  );
}
