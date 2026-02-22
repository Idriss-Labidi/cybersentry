import { useState, type FC } from 'react';
import { AppShell, Divider } from '@mantine/core';
import { Outlet } from 'react-router-dom';
import { LandingHeader } from './LandingHeader';
import { LandingFooter } from './LandingFooter';
import LandingNavbar from './LandingNavbar';

export interface LandingNavLink {
    label: string;
    href: string;
}

const navLinks = [
	{ label: 'Features', href: '#features' },
	{ label: 'Pricing', href: '#pricing' },
	{ label: 'About', href: '#about' },
	{ label: 'Contact', href: '#contact' },
];

const LandingLayout: FC = () => {
	const [mobileOpened, setMobileOpened] = useState(false);

	return (
		<AppShell
			padding="0"
			header={{ height: 72 }}
			navbar={{ width: 300, breakpoint: 'sm', collapsed: { desktop: true, mobile: !mobileOpened } }}
			footer={{ height: 110 }}
		>
			<AppShell.Header>
				<LandingHeader mobileOpened={mobileOpened} setMobileOpened={setMobileOpened} links={navLinks} />
				<Divider />
			</AppShell.Header>

			<AppShell.Navbar>
				<LandingNavbar links={navLinks}></LandingNavbar>
			</AppShell.Navbar>

			<AppShell.Main>
				<Outlet></Outlet>
			</AppShell.Main>

			<AppShell.Footer>
				<LandingFooter />
			</AppShell.Footer>
		</AppShell>
	);
};

export default LandingLayout;
