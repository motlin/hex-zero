/**
 * Settings screen for game preferences
 */

import React from 'react';
import {View, Text, StyleSheet, Switch, TouchableOpacity, SafeAreaView, ScrollView, Alert} from 'react-native';
import {useThemeContext} from '../context/ThemeContext';
import {useSettings} from '../contexts/SettingsContext';

interface SettingsScreenProps {
	onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({onBack}) => {
	const {theme, isDark, toggleTheme} = useThemeContext();
	const {settings, updateSetting, resetSettings} = useSettings();

	const handleResetSettings = () => {
		Alert.alert('Reset Settings', 'Are you sure you want to reset all settings to defaults?', [
			{text: 'Cancel', style: 'cancel'},
			{
				text: 'Reset',
				style: 'destructive',
				onPress: resetSettings,
			},
		]);
	};

	return (
		<SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]}>
			{/* Header */}
			<View style={[styles.header, {backgroundColor: theme.colors.surface}]}>
				<TouchableOpacity
					onPress={onBack}
					style={styles.backButton}
				>
					<Text style={[styles.backButtonText, {color: theme.colors.text}]}>← Back</Text>
				</TouchableOpacity>
				<Text style={[styles.headerTitle, {color: theme.colors.text}]}>Settings</Text>
				<View style={styles.headerSpacer} />
			</View>

			{/* Settings Content */}
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={true}
			>
				{/* Appearance */}
				<View style={styles.section}>
					<Text style={[styles.sectionTitle, {color: theme.colors.text}]}>🎨 Appearance</Text>

					<View style={styles.setting}>
						<View style={styles.settingInfo}>
							<Text style={[styles.settingLabel, {color: theme.colors.text}]}>Dark Mode</Text>
							<Text style={[styles.settingDescription, {color: theme.colors.textSecondary}]}>
								Use dark theme for better visibility in low light
							</Text>
						</View>
						<Switch
							value={isDark}
							onValueChange={toggleTheme}
							trackColor={{
								false: theme.colors.textSecondary,
								true: theme.colors.burstColor,
							}}
							thumbColor={theme.colors.surface}
						/>
					</View>

					<View style={styles.setting}>
						<View style={styles.settingInfo}>
							<Text style={[styles.settingLabel, {color: theme.colors.text}]}>Show Coordinates</Text>
							<Text style={[styles.settingDescription, {color: theme.colors.textSecondary}]}>
								Display hex coordinates on the game board
							</Text>
						</View>
						<Switch
							value={settings.showCoordinates}
							onValueChange={(value) => updateSetting('showCoordinates', value)}
							trackColor={{
								false: theme.colors.textSecondary,
								true: theme.colors.burstColor,
							}}
							thumbColor={theme.colors.surface}
						/>
					</View>
				</View>

				{/* Gameplay */}
				<View style={styles.section}>
					<Text style={[styles.sectionTitle, {color: theme.colors.text}]}>🎮 Gameplay</Text>

					<View style={styles.setting}>
						<View style={styles.settingInfo}>
							<Text style={[styles.settingLabel, {color: theme.colors.text}]}>Auto-Advance Pieces</Text>
							<Text style={[styles.settingDescription, {color: theme.colors.textSecondary}]}>
								Automatically show next pieces when current page is empty
							</Text>
						</View>
						<Switch
							value={settings.autoAdvancePieces}
							onValueChange={(value) => updateSetting('autoAdvancePieces', value)}
							trackColor={{
								false: theme.colors.textSecondary,
								true: theme.colors.burstColor,
							}}
							thumbColor={theme.colors.surface}
						/>
					</View>

					<View style={styles.setting}>
						<View style={styles.settingInfo}>
							<Text style={[styles.settingLabel, {color: theme.colors.text}]}>Confirm Restart</Text>
							<Text style={[styles.settingDescription, {color: theme.colors.textSecondary}]}>
								Ask for confirmation before restarting the game
							</Text>
						</View>
						<Switch
							value={settings.confirmRestart}
							onValueChange={(value) => updateSetting('confirmRestart', value)}
							trackColor={{
								false: theme.colors.textSecondary,
								true: theme.colors.burstColor,
							}}
							thumbColor={theme.colors.surface}
						/>
					</View>

					<View style={styles.setting}>
						<View style={styles.settingInfo}>
							<Text style={[styles.settingLabel, {color: theme.colors.text}]}>Confirm Exit</Text>
							<Text style={[styles.settingDescription, {color: theme.colors.textSecondary}]}>
								Ask for confirmation before exiting to menu
							</Text>
						</View>
						<Switch
							value={settings.confirmExit}
							onValueChange={(value) => updateSetting('confirmExit', value)}
							trackColor={{
								false: theme.colors.textSecondary,
								true: theme.colors.burstColor,
							}}
							thumbColor={theme.colors.surface}
						/>
					</View>
				</View>

				{/* Feedback */}
				<View style={styles.section}>
					<Text style={[styles.sectionTitle, {color: theme.colors.text}]}>📳 Feedback</Text>

					<View style={styles.setting}>
						<View style={styles.settingInfo}>
							<Text style={[styles.settingLabel, {color: theme.colors.text}]}>Sound Effects</Text>
							<Text style={[styles.settingDescription, {color: theme.colors.textSecondary}]}>
								Play sounds for game actions
							</Text>
						</View>
						<Switch
							value={settings.soundEnabled}
							onValueChange={(value) => updateSetting('soundEnabled', value)}
							trackColor={{
								false: theme.colors.textSecondary,
								true: theme.colors.burstColor,
							}}
							thumbColor={theme.colors.surface}
						/>
					</View>

					<View style={styles.setting}>
						<View style={styles.settingInfo}>
							<Text style={[styles.settingLabel, {color: theme.colors.text}]}>Haptic Feedback</Text>
							<Text style={[styles.settingDescription, {color: theme.colors.textSecondary}]}>
								Vibrate on piece placement and interactions
							</Text>
						</View>
						<Switch
							value={settings.hapticEnabled}
							onValueChange={(value) => updateSetting('hapticEnabled', value)}
							trackColor={{
								false: theme.colors.textSecondary,
								true: theme.colors.burstColor,
							}}
							thumbColor={theme.colors.surface}
						/>
					</View>
				</View>

				{/* Actions */}
				<View style={[styles.section, styles.lastSection]}>
					<TouchableOpacity
						style={[styles.actionButton, {backgroundColor: theme.colors.surface}]}
						onPress={handleResetSettings}
					>
						<Text style={[styles.actionButtonText, {color: theme.colors.text}]}>Reset to Defaults</Text>
					</TouchableOpacity>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 15,
		paddingVertical: 10,
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(0, 0, 0, 0.1)',
	},
	backButton: {
		padding: 5,
	},
	backButtonText: {
		fontSize: 16,
		fontWeight: '600',
	},
	headerTitle: {
		fontSize: 20,
		fontWeight: 'bold',
	},
	saveButton: {
		padding: 5,
	},
	saveButtonDisabled: {
		opacity: 0.5,
	},
	saveButtonText: {
		fontSize: 16,
		fontWeight: '600',
	},
	headerSpacer: {
		width: 60,
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		paddingVertical: 20,
	},
	section: {
		paddingHorizontal: 20,
		marginBottom: 30,
	},
	lastSection: {
		marginBottom: 40,
	},
	sectionTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		marginBottom: 20,
	},
	setting: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 25,
	},
	settingInfo: {
		flex: 1,
		marginRight: 15,
	},
	settingLabel: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 4,
	},
	settingDescription: {
		fontSize: 14,
		lineHeight: 18,
	},
	actionButton: {
		paddingVertical: 15,
		paddingHorizontal: 20,
		borderRadius: 10,
		alignItems: 'center',
	},
	actionButtonText: {
		fontSize: 16,
		fontWeight: '600',
	},
});
