import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Collapse, Group, Paper, Select, SimpleGrid, Stack, Text, TextInput } from '@mantine/core';
import { IconAdjustmentsHorizontal, IconSearch, IconX } from '@tabler/icons-react';
import { assetTypeOptions, categoryOptions, statusOptions } from '../../utils/assets/assetForm';

type AssetsFiltersProps = {
  filteredCount: number;
  totalCount: number;
  productionCount: number;
  developmentCount: number;
  testCount: number;
  searchTerm: string;
  typeFilter: string;
  categoryFilter: string;
  statusFilter: string;
  onSearchChange: (value: string) => void;
  onTypeFilterChange: (value: string) => void;
  onCategoryFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
};

export default function AssetsFilters({
  filteredCount,
  totalCount,
  productionCount,
  developmentCount,
  testCount,
  searchTerm,
  typeFilter,
  categoryFilter,
  statusFilter,
  onSearchChange,
  onTypeFilterChange,
  onCategoryFilterChange,
  onStatusFilterChange,
}: AssetsFiltersProps) {
  const hasAdvancedFilters = typeFilter !== 'all' || categoryFilter !== 'all' || statusFilter !== 'all';
  const [advancedOpened, setAdvancedOpened] = useState(hasAdvancedFilters);

  useEffect(() => {
    if (hasAdvancedFilters) {
      setAdvancedOpened(true);
    }
  }, [hasAdvancedFilters]);

  const summaryLabel = useMemo(() => {
    if (filteredCount === totalCount) {
      return `${totalCount} total`;
    }

    return `${filteredCount} of ${totalCount}`;
  }, [filteredCount, totalCount]);

  return (
    <Paper p="lg" radius="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <div>
            <Text fw={800}>Asset inventory</Text>
            <Text size="sm" c="dimmed" mt={4}>
              Search quickly, then open advanced filters only when you need to narrow the list.
            </Text>
          </div>
          <Group gap="xs">
            <Badge variant="light">{summaryLabel} shown</Badge>
            <Badge variant="dot" color="red">
              Prod {productionCount}
            </Badge>
            <Badge variant="dot" color="blue">
              Dev {developmentCount}
            </Badge>
            <Badge variant="dot" color="gray">
              Test {testCount}
            </Badge>
          </Group>
        </Group>

        <Group align="end" wrap="wrap">
          <TextInput
            style={{ flex: 1, minWidth: 280 }}
            label="Search"
            placeholder="Search by name, value, description, or tag"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.currentTarget.value)}
            leftSection={<IconSearch size={16} />}
          />
          <Button
            variant={advancedOpened || hasAdvancedFilters ? 'light' : 'default'}
            leftSection={<IconAdjustmentsHorizontal size={16} />}
            onClick={() => setAdvancedOpened((current) => !current)}
          >
            Filters
          </Button>
          {hasAdvancedFilters || searchTerm ? (
            <Button
              variant="subtle"
              color="gray"
              leftSection={<IconX size={16} />}
              onClick={() => {
                onSearchChange('');
                onTypeFilterChange('all');
                onCategoryFilterChange('all');
                onStatusFilterChange('all');
                setAdvancedOpened(false);
              }}
            >
              Clear
            </Button>
          ) : null}
        </Group>

        <Collapse in={advancedOpened}>
          <SimpleGrid cols={{ base: 1, sm: 2, xl: 3 }} spacing="md">
            <Select
              label="Type"
              value={typeFilter}
              onChange={(value) => onTypeFilterChange(value ?? 'all')}
              allowDeselect={false}
              data={[
                { value: 'all', label: 'All types' },
                ...assetTypeOptions.map((option) => ({ value: option.value, label: option.label })),
              ]}
            />
            <Select
              label="Category"
              value={categoryFilter}
              onChange={(value) => onCategoryFilterChange(value ?? 'all')}
              allowDeselect={false}
              data={[
                { value: 'all', label: 'All categories' },
                ...categoryOptions.map((option) => ({ value: option.value, label: option.label })),
              ]}
            />
            <Select
              label="Status"
              value={statusFilter}
              onChange={(value) => onStatusFilterChange(value ?? 'all')}
              allowDeselect={false}
              data={[
                { value: 'all', label: 'All statuses' },
                ...statusOptions.map((option) => ({ value: option.value, label: option.label })),
              ]}
            />
          </SimpleGrid>
        </Collapse>
      </Stack>
    </Paper>
  );
}
