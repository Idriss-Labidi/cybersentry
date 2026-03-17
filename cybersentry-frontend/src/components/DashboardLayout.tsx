import { useState } from 'react';
import { AppShell } from '@mantine/core';
import { Outlet } from 'react-router-dom';
import DashboardHeader from './DashboardHeader';
import DashboardNavbar from './DashboardNavbar';

const DashboardLayout = () => {
  const [mobileOpened, setMobileOpened] = useState(false);

  return (
    <AppShell
      header={{ height: 76 }}
      navbar={{ width: 312, breakpoint: 'md', collapsed: { mobile: !mobileOpened } }}
      padding={0}
    >
      <AppShell.Header px="md">
        <DashboardHeader mobileOpened={mobileOpened} setMobileOpened={setMobileOpened} />
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <DashboardNavbar />
      </AppShell.Navbar>

      <AppShell.Main>
        <div style={{ minHeight: 'calc(100vh - 76px)', padding: '0.5rem 0 2rem' }}>
          <Outlet />
        </div>
      </AppShell.Main>
    </AppShell>
  );
};

export default DashboardLayout;
