/**
 * Help screen with game instructions and keyboard shortcuts
 */

import React from 'react';
import {View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity} from 'react-native';
import {useThemeContext} from '../context/ThemeContext';

interface HelpScreenProps {
	onBack: () => void;
}

export const HelpScreen: React.FC<HelpScreenProps> = ({onBack}) => {
	const {theme} = useThemeContext();

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
				<Text style={[styles.headerTitle, {color: theme.colors.text}]}>How to Play</Text>
				<View style={styles.headerSpacer} />
			</View>

			{/* Content */}
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={true}
			>
				{/* Game Objective */}
				<View style={styles.section}>
					<Text style={[styles.sectionTitle, {color: theme.colors.text}]}>🎯 Game Objective</Text>
					<Text style={[styles.paragraph, {color: theme.colors.textSecondary}]}>
						Clear all hexagons from the board by placing septomino pieces. Each piece reduces the height of
						hexagons it covers by 1. When a hexagon reaches height 0, it disappears!
					</Text>
				</View>

				{/* How to Play */}
				<View style={styles.section}>
					<Text style={[styles.sectionTitle, {color: theme.colors.text}]}>🎮 How to Play</Text>

					<View style={styles.step}>
						<Text style={[styles.stepNumber, {color: theme.colors.burstColor}]}>1.</Text>
						<Text style={[styles.stepText, {color: theme.colors.textSecondary}]}>
							Select a piece from the bottom panel by tapping it
						</Text>
					</View>

					<View style={styles.step}>
						<Text style={[styles.stepNumber, {color: theme.colors.burstColor}]}>2.</Text>
						<Text style={[styles.stepText, {color: theme.colors.textSecondary}]}>
							Drag the piece over the board to see where it can be placed
						</Text>
					</View>

					<View style={styles.step}>
						<Text style={[styles.stepNumber, {color: theme.colors.burstColor}]}>3.</Text>
						<Text style={[styles.stepText, {color: theme.colors.textSecondary}]}>
							Drop the piece on valid hexagons (highlighted in green)
						</Text>
					</View>

					<View style={styles.step}>
						<Text style={[styles.stepNumber, {color: theme.colors.burstColor}]}>4.</Text>
						<Text style={[styles.stepText, {color: theme.colors.textSecondary}]}>
							Continue placing pieces until all hexagons are cleared
						</Text>
					</View>
				</View>

				{/* Controls */}
				<View style={styles.section}>
					<Text style={[styles.sectionTitle, {color: theme.colors.text}]}>🕹️ Controls</Text>

					<View style={styles.control}>
						<Text style={[styles.controlAction, {color: theme.colors.text}]}>Pan Board</Text>
						<Text style={[styles.controlMethod, {color: theme.colors.textSecondary}]}>
							Drag with one finger
						</Text>
					</View>

					<View style={styles.control}>
						<Text style={[styles.controlAction, {color: theme.colors.text}]}>Zoom In/Out</Text>
						<Text style={[styles.controlMethod, {color: theme.colors.textSecondary}]}>
							Pinch with two fingers
						</Text>
					</View>

					<View style={styles.control}>
						<Text style={[styles.controlAction, {color: theme.colors.text}]}>Select Piece</Text>
						<Text style={[styles.controlMethod, {color: theme.colors.textSecondary}]}>
							Tap piece in bottom panel
						</Text>
					</View>

					<View style={styles.control}>
						<Text style={[styles.controlAction, {color: theme.colors.text}]}>Place Piece</Text>
						<Text style={[styles.controlMethod, {color: theme.colors.textSecondary}]}>
							Drag and drop onto board
						</Text>
					</View>

					<View style={styles.control}>
						<Text style={[styles.controlAction, {color: theme.colors.text}]}>Navigate Pieces</Text>
						<Text style={[styles.controlMethod, {color: theme.colors.textSecondary}]}>
							Swipe left/right on piece panel
						</Text>
					</View>
				</View>

				{/* Game Features */}
				<View style={styles.section}>
					<Text style={[styles.sectionTitle, {color: theme.colors.text}]}>✨ Game Features</Text>

					<View style={styles.feature}>
						<Text style={[styles.featureName, {color: theme.colors.text}]}>💡 Hints</Text>
						<Text style={[styles.featureDesc, {color: theme.colors.textSecondary}]}>
							Shows valid placement locations for pieces
						</Text>
					</View>

					<View style={styles.feature}>
						<Text style={[styles.featureName, {color: theme.colors.text}]}>↶ Undo/Redo</Text>
						<Text style={[styles.featureDesc, {color: theme.colors.textSecondary}]}>
							Reverse or replay your moves
						</Text>
					</View>

					<View style={styles.feature}>
						<Text style={[styles.featureName, {color: theme.colors.text}]}>🎯 Auto-Advance</Text>
						<Text style={[styles.featureDesc, {color: theme.colors.textSecondary}]}>
							Automatically shows next pieces when current page is empty
						</Text>
					</View>

					<View style={styles.feature}>
						<Text style={[styles.featureName, {color: theme.colors.text}]}>📱 Touch Feedback</Text>
						<Text style={[styles.featureDesc, {color: theme.colors.textSecondary}]}>
							Visual and haptic feedback for actions
						</Text>
					</View>
				</View>

				{/* Keyboard Shortcuts (for external keyboards) */}
				<View style={styles.section}>
					<Text style={[styles.sectionTitle, {color: theme.colors.text}]}>⌨️ Keyboard Shortcuts</Text>
					<Text style={[styles.subtitle, {color: theme.colors.textSecondary}]}>(External keyboard only)</Text>

					<View style={styles.shortcut}>
						<Text style={[styles.shortcutKey, {color: theme.colors.text}]}>Space</Text>
						<Text style={[styles.shortcutAction, {color: theme.colors.textSecondary}]}>
							Select next piece
						</Text>
					</View>

					<View style={styles.shortcut}>
						<Text style={[styles.shortcutKey, {color: theme.colors.text}]}>1-4</Text>
						<Text style={[styles.shortcutAction, {color: theme.colors.textSecondary}]}>
							Select piece by number
						</Text>
					</View>

					<View style={styles.shortcut}>
						<Text style={[styles.shortcutKey, {color: theme.colors.text}]}>H</Text>
						<Text style={[styles.shortcutAction, {color: theme.colors.textSecondary}]}>Toggle hints</Text>
					</View>

					<View style={styles.shortcut}>
						<Text style={[styles.shortcutKey, {color: theme.colors.text}]}>Z / ⌘+Z</Text>
						<Text style={[styles.shortcutAction, {color: theme.colors.textSecondary}]}>Undo last move</Text>
					</View>

					<View style={styles.shortcut}>
						<Text style={[styles.shortcutKey, {color: theme.colors.text}]}>Y / ⌘+Y</Text>
						<Text style={[styles.shortcutAction, {color: theme.colors.textSecondary}]}>Redo last move</Text>
					</View>

					<View style={styles.shortcut}>
						<Text style={[styles.shortcutKey, {color: theme.colors.text}]}>R</Text>
						<Text style={[styles.shortcutAction, {color: theme.colors.textSecondary}]}>Restart game</Text>
					</View>

					<View style={styles.shortcut}>
						<Text style={[styles.shortcutKey, {color: theme.colors.text}]}>Esc</Text>
						<Text style={[styles.shortcutAction, {color: theme.colors.textSecondary}]}>Back to menu</Text>
					</View>
				</View>

				{/* Tips */}
				<View style={[styles.section, styles.lastSection]}>
					<Text style={[styles.sectionTitle, {color: theme.colors.text}]}>💡 Tips</Text>

					<Text style={[styles.tip, {color: theme.colors.textSecondary}]}>
						• Look for pieces that fit into corners and edges first
					</Text>
					<Text style={[styles.tip, {color: theme.colors.textSecondary}]}>
						• Use hints sparingly - they count towards your score
					</Text>
					<Text style={[styles.tip, {color: theme.colors.textSecondary}]}>
						• Plan ahead - some pieces may block future placements
					</Text>
					<Text style={[styles.tip, {color: theme.colors.textSecondary}]}>
						• Zoom out to see the entire board and plan your strategy
					</Text>
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
		fontSize: 22,
		fontWeight: 'bold',
		marginBottom: 15,
	},
	subtitle: {
		fontSize: 14,
		marginTop: -10,
		marginBottom: 15,
		fontStyle: 'italic',
	},
	paragraph: {
		fontSize: 16,
		lineHeight: 24,
	},
	step: {
		flexDirection: 'row',
		marginBottom: 15,
		paddingLeft: 10,
	},
	stepNumber: {
		fontSize: 18,
		fontWeight: 'bold',
		marginRight: 15,
		width: 25,
	},
	stepText: {
		fontSize: 16,
		lineHeight: 24,
		flex: 1,
	},
	control: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 12,
		paddingHorizontal: 10,
	},
	controlAction: {
		fontSize: 16,
		fontWeight: '600',
		flex: 1,
	},
	controlMethod: {
		fontSize: 16,
		flex: 1,
		textAlign: 'right',
	},
	feature: {
		marginBottom: 15,
		paddingHorizontal: 10,
	},
	featureName: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 5,
	},
	featureDesc: {
		fontSize: 15,
		lineHeight: 22,
	},
	shortcut: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 12,
		paddingHorizontal: 10,
	},
	shortcutKey: {
		fontSize: 16,
		fontWeight: '600',
		fontFamily: 'monospace',
		backgroundColor: 'rgba(128, 128, 128, 0.1)',
		paddingHorizontal: 10,
		paddingVertical: 2,
		borderRadius: 4,
		minWidth: 60,
		textAlign: 'center',
	},
	shortcutAction: {
		fontSize: 16,
		flex: 1,
		marginLeft: 20,
	},
	tip: {
		fontSize: 15,
		lineHeight: 24,
		marginBottom: 8,
	},
});
