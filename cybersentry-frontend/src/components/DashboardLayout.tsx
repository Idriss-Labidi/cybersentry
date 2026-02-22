import { useState } from 'react';
import { AppShell } from '@mantine/core';
import { Outlet } from 'react-router-dom';
import DashboardHeader from './DashboardHeader';
import DashboardNavbar from './DashboardNavbar';

const DashboardLayout = () => {
  const [mobileOpened, setMobileOpened] = useState(false);

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !mobileOpened } }}
      padding="md"
    >
      <AppShell.Header p="md">
        <DashboardHeader mobileOpened={mobileOpened} setMobileOpened={setMobileOpened} />
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <DashboardNavbar />
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
};

export default DashboardLayout;



