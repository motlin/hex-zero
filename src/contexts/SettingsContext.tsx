/**
 * Context for managing game settings throughout the app
 */

import React, {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface GameSettings {
	soundEnabled: boolean;
	hapticEnabled: boolean;
	showCoordinates: boolean;
	autoAdvancePieces: boolean;
	confirmRestart: boolean;
	confirmExit: boolean;
}

const DEFAULT_SETTINGS: GameSettings = {
	soundEnabled: true,
	hapticEnabled: true,
	showCoordinates: false,
	autoAdvancePieces: true,
	confirmRestart: true,
	confirmExit: true,
};

interface SettingsContextType {
	settings: GameSettings;
	updateSetting: <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => void;
	resetSettings: () => void;
}

const SETTINGS_KEY = 'hex-zero-settings';

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
	children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({children}) => {
	const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);

	// Load settings on mount
	useEffect(() => {
		loadSettings();
	}, []);

	const loadSettings = async () => {
		try {
			const savedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
			if (savedSettings) {
				setSettings(JSON.parse(savedSettings));
			}
		} catch (error) {
			console.error('Failed to load settings:', error);
		}
	};

	const saveSettings = async (newSettings: GameSettings) => {
		try {
			await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
		} catch (error) {
			console.error('Failed to save settings:', error);
		}
	};

	const updateSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
		const newSettings = {...settings, [key]: value};
		setSettings(newSettings);
		saveSettings(newSettings);
	};

	const resetSettings = () => {
		setSettings(DEFAULT_SETTINGS);
		saveSettings(DEFAULT_SETTINGS);
	};

	return (
		<SettingsContext.Provider value={{settings, updateSetting, resetSettings}}>{children}</SettingsContext.Provider>
	);
};

export const useSettings = (): SettingsContextType => {
	const context = useContext(SettingsContext);
	if (!context) {
		throw new Error('useSettings must be used within a SettingsProvider');
	}
	return context;
};
