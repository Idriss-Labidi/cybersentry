import { useState, type FC } from 'react';
import { AppShell, Divider } from '@mantine/core';
import { Outlet } from 'react-router-dom';
import { LandingNavbar } from './LandingNavbar';
import { LandingFooter } from './LandingFooter';


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
			footer={{ height: 110 }}
		>
			<AppShell.Header>
				<LandingNavbar mobileOpened={mobileOpened} setMobileOpened={setMobileOpened} links={navLinks} />
				<Divider />
			</AppShell.Header>


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
