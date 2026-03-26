import { useState } from 'react';
import { AppShell } from '@mantine/core';
import { Outlet } from 'react-router-dom';
import DashboardHeader from './DashboardHeader';
import DashboardNavbar from './DashboardNavbar';
import { DashboardBreadcrumbContext } from './DashboardBreadcrumbContext';

const DashboardLayout = () => {
  const [mobileOpened, setMobileOpened] = useState(false);
  const [desktopOpened, setDesktopOpened] = useState(true);
  const [currentBreadcrumbLabel, setCurrentBreadcrumbLabel] = useState<string | null>(null);

  return (
    <DashboardBreadcrumbContext.Provider
      value={{
        currentLabel: currentBreadcrumbLabel,
        setCurrentLabel: setCurrentBreadcrumbLabel,
      }}
    >
      <AppShell
        header={{ height: 76 }}
        navbar={{
          width: 312,
          breakpoint: 'md',
          collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
        }}
        padding={0}
      >
        <AppShell.Header px="md">
          <DashboardHeader
            mobileOpened={mobileOpened}
            setMobileOpened={setMobileOpened}
            desktopOpened={desktopOpened}
            setDesktopOpened={setDesktopOpened}
          />
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
    </DashboardBreadcrumbContext.Provider>
  );
};

export default DashboardLayout;
