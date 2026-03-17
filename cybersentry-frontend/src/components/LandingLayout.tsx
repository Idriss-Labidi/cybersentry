import { useState, type FC } from 'react';
import { AppShell } from '@mantine/core';
import { Outlet } from 'react-router-dom';
import { LandingHeader } from './LandingHeader';
import { LandingFooter } from './LandingFooter';
import LandingNavbar from './LandingNavbar';

export interface LandingNavLink {
  label: string;
  href: string;
  children?: LandingNavLink[];
}

const navLinks: LandingNavLink[] = [
  { label: 'Features', href: '/#features' },
  {
    label: 'Tools',
    href: '/#tools',
    children: [
      { label: 'DNS Lookup', href: '/tools/dns-lookup' },
      { label: 'DNS Propagation', href: '/tools/dns-propagation' },
      { label: 'DNS Health Check', href: '/tools/dns-health-check' },
      { label: 'WHOIS Lookup', href: '/tools/whois-lookup' },
      { label: 'IP Reputation', href: '/tools/ip-reputation' },
      { label: 'Reverse IP', href: '/tools/reverse-ip' },
      { label: 'Email Security', href: '/tools/email-security' },
      { label: 'Typosquatting Detection', href: '/tools/typosquatting' },
    ],
  },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'About', href: '/#about' },
  { label: 'Contact', href: '/#contact' },
];

const LandingLayout: FC = () => {
  const [mobileOpened, setMobileOpened] = useState(false);

  return (
    <AppShell
      padding={0}
      header={{ height: 82 }}
      navbar={{
        width: 320,
        breakpoint: 'sm',
        collapsed: { desktop: true, mobile: !mobileOpened },
      }}
      className="landing-shell"
    >
      <AppShell.Header>
        <LandingHeader
          mobileOpened={mobileOpened}
          setMobileOpened={setMobileOpened}
          links={navLinks}
        />
      </AppShell.Header>

      <AppShell.Navbar>
        <LandingNavbar links={navLinks} />
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
        <LandingFooter />
      </AppShell.Main>
    </AppShell>
  );
};

export default LandingLayout;
