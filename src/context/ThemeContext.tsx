/**
 * 🎨 Theme context for React Native app
 */

import React, {createContext, useContext, type ReactNode} from 'react';
import {useTheme, type UseThemeReturn} from '../hooks/useTheme';

const ThemeContext = createContext<UseThemeReturn | undefined>(undefined);

export interface ThemeProviderProps {
	children: ReactNode;
}

/**
 * 🎨 Theme provider component
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({children}) => {
	const themeValue = useTheme();

	return <ThemeContext.Provider value={themeValue}>{children}</ThemeContext.Provider>;
};

/**
 * 🎨 Hook to use theme context
 */
export const useThemeContext = (): UseThemeReturn => {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error('useThemeContext must be used within a ThemeProvider');
	}
	return context;
};

/**
 * 🎨 HOC to inject theme props
 */
export function withTheme<P extends object>(Component: React.ComponentType<P & {theme: UseThemeReturn}>) {
	const ThemedComponent = (props: P) => {
		const theme = useThemeContext();
		return (
			<Component
				{...props}
				theme={theme}
			/>
		);
	};

	ThemedComponent.displayName = `withTheme(${Component.displayName || Component.name})`;
	return ThemedComponent;
}
