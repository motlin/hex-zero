/**
 * 🎨 Theme management hook for React Native app
 */

import {useState, useCallback, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Appearance} from 'react-native';
import {getTheme, type ThemeType, type SkiaTheme} from '../ui/SkiaColorTheme';

const THEME_STORAGE_KEY = '@HexZero:theme';

export interface UseThemeReturn {
	theme: SkiaTheme;
	themeType: ThemeType;
	isDark: boolean;
	setTheme: (type: ThemeType) => void;
	toggleTheme: () => void;
	isLoading: boolean;
}

/**
 * 🎨 Hook for managing app theme
 */
export function useTheme(): UseThemeReturn {
	const [themeType, setThemeType] = useState<ThemeType>('dark');
	const [isLoading, setIsLoading] = useState(true);

	// Load saved theme on mount
	useEffect(() => {
		loadSavedTheme();
	}, []);

	// Listen for system theme changes
	useEffect(() => {
		const subscription = Appearance.addChangeListener(({colorScheme}) => {
			if (colorScheme) {
				const systemTheme: ThemeType = colorScheme === 'dark' ? 'dark' : 'light';
				setThemeType(systemTheme);
				saveTheme(systemTheme);
			}
		});

		return () => subscription?.remove();
	}, []);

	const loadSavedTheme = async () => {
		try {
			const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
			if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
				setThemeType(savedTheme as ThemeType);
			} else {
				// Use system theme as fallback
				const systemTheme = Appearance.getColorScheme();
				setThemeType(systemTheme === 'light' ? 'light' : 'dark');
			}
		} catch (error) {
			console.warn('Failed to load theme from storage:', error);
			// Fallback to system theme
			const systemTheme = Appearance.getColorScheme();
			setThemeType(systemTheme === 'light' ? 'light' : 'dark');
		} finally {
			setIsLoading(false);
		}
	};

	const saveTheme = async (type: ThemeType) => {
		try {
			await AsyncStorage.setItem(THEME_STORAGE_KEY, type);
		} catch (error) {
			console.warn('Failed to save theme to storage:', error);
		}
	};

	const setTheme = useCallback((type: ThemeType) => {
		setThemeType(type);
		saveTheme(type);
	}, []);

	const toggleTheme = useCallback(() => {
		const newType: ThemeType = themeType === 'light' ? 'dark' : 'light';
		setTheme(newType);
	}, [themeType, setTheme]);

	const theme = getTheme(themeType);
	const isDark = themeType === 'dark';

	return {
		theme,
		themeType,
		isDark,
		setTheme,
		toggleTheme,
		isLoading,
	};
}

/**
 * 🎨 Get current system theme
 */
export function getSystemTheme(): ThemeType {
	const systemTheme = Appearance.getColorScheme();
	return systemTheme === 'light' ? 'light' : 'dark';
}
