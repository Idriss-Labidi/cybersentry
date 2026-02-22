import {type FC} from "react"
import { type LandingNavLink } from "./LandingLayout";
import { NavLink, ScrollArea, Stack } from "@mantine/core";
import { Link } from "react-router-dom";

const LandingNavbar: FC<{ links : LandingNavLink[]}> = ({ links }) => {
    return ( 
        <ScrollArea>
            <Stack>
                { links.map( link => <NavLink
                    component={Link}
                    to={link.href}
                    label={link.label}
                />)}
            </Stack>
        </ScrollArea>
    );
}

export default LandingNavbar;