import { Container, Text, Title } from '@mantine/core';

export const Dashboard = () => {
  return (
    <Container>
      <Title order={1}>Dashboard</Title>
      <Text c="dimmed">Welcome to your dashboard. This is the main overview page.</Text>
    </Container>
  );
};

