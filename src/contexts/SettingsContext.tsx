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

function isGameSettings(value: unknown): value is GameSettings {
	return (
		typeof value === 'object' &&
		value !== null &&
		'soundEnabled' in value &&
		typeof value.soundEnabled === 'boolean' &&
		'hapticEnabled' in value &&
		typeof value.hapticEnabled === 'boolean' &&
		'showCoordinates' in value &&
		typeof value.showCoordinates === 'boolean' &&
		'autoAdvancePieces' in value &&
		typeof value.autoAdvancePieces === 'boolean' &&
		'confirmRestart' in value &&
		typeof value.confirmRestart === 'boolean' &&
		'confirmExit' in value &&
		typeof value.confirmExit === 'boolean'
	);
}

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
		void loadSettings();
	}, []);

	const loadSettings = async () => {
		try {
			const savedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
			if (savedSettings !== null) {
				const parsedSettings: unknown = JSON.parse(savedSettings);
				if (!isGameSettings(parsedSettings)) throw new Error('Stored settings have an invalid shape');
				setSettings(parsedSettings);
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
		void saveSettings(newSettings);
	};

	const resetSettings = () => {
		setSettings(DEFAULT_SETTINGS);
		void saveSettings(DEFAULT_SETTINGS);
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
