import { createTheme, MantineProvider } from "@mantine/core";
import { createContext, useContext, useState, type ReactNode } from "react";


interface ThemeContextType {
    colorScheme: 'dark' | 'light';
    toggleColorScheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children } : { children: ReactNode }) => {
    const [colorScheme, setColorScheme] = useState<'dark' | 'light'>('dark');
    const mantineThemeOverrides = createTheme({  
        primaryColor: 'green',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        headings: { fontFamily: 'system-ui, -apple-system, sans-serif' },
    });

    const toggleColorScheme = () => { 
        colorScheme === 'light' ? setColorScheme('dark') : setColorScheme('light');
    }


    const value: ThemeContextType ={
        colorScheme, 
        toggleColorScheme
    }

    return (<ThemeContext.Provider value={value}>
        <MantineProvider theme={mantineThemeOverrides} forceColorScheme={colorScheme}>
            {children}
        </MantineProvider>
    </ThemeContext.Provider>);
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};