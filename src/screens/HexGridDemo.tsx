/**
 * Demo screen to test basic hex grid rendering with Skia
 */

import React, {useState} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import {Canvas} from '@shopify/react-native-skia';
import {SkiaHexRenderer} from '../renderer/SkiaHexRenderer';
import {HexGrid} from '../state/HexGrid';
import {useThemeContext} from '../context/ThemeContext';

export const HexGridDemo: React.FC = () => {
	const {theme: currentTheme, themeType, setTheme} = useThemeContext();

	const [grid] = useState(() => {
		const newGrid = new HexGrid(5);
		// Initialize with some test data
		newGrid.forEachHex((q, r) => {
			const distance = Math.abs(q) + Math.abs(q + r) + Math.abs(r);
			const height = Math.max(0, 10 - distance);
			const hex = newGrid.getHex(q, r);
			if (hex) {
				hex.height = height;
			}
		});
		return newGrid;
	});

	const [hexSize, setHexSize] = useState(30);
	const [scale, setScale] = useState(1);

	return (
		<View style={[styles.container, {backgroundColor: currentTheme.colors.background}]}>
			<View style={styles.header}>
				<Text style={[styles.title, {color: currentTheme.colors.text}]}>Hex Grid Rendering Test</Text>
			</View>

			<View style={[styles.canvasContainer, {backgroundColor: currentTheme.colors.surface}]}>
				<Canvas style={styles.canvas}>
					<SkiaHexRenderer
						grid={grid}
						hexSize={hexSize}
						offsetX={200}
						offsetY={200}
						scale={scale}
						theme={themeType}
					/>
				</Canvas>
			</View>

			<ScrollView style={[styles.controls, {backgroundColor: currentTheme.colors.surface}]}>
				<View style={styles.controlSection}>
					<Text style={[styles.sectionTitle, {color: currentTheme.colors.text}]}>Hex Size: {hexSize}</Text>
					<View style={styles.buttonRow}>
						<TouchableOpacity
							style={styles.button}
							onPress={() => setHexSize(Math.max(10, hexSize - 5))}
						>
							<Text style={styles.buttonText}>-</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={styles.button}
							onPress={() => setHexSize(Math.min(50, hexSize + 5))}
						>
							<Text style={styles.buttonText}>+</Text>
						</TouchableOpacity>
					</View>
				</View>

				<View style={styles.controlSection}>
					<Text style={[styles.sectionTitle, {color: currentTheme.colors.text}]}>
						Scale: {scale.toFixed(1)}
					</Text>
					<View style={styles.buttonRow}>
						<TouchableOpacity
							style={styles.button}
							onPress={() => setScale(Math.max(0.5, scale - 0.1))}
						>
							<Text style={styles.buttonText}>-</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={styles.button}
							onPress={() => setScale(Math.min(2, scale + 0.1))}
						>
							<Text style={styles.buttonText}>+</Text>
						</TouchableOpacity>
					</View>
				</View>

				<View style={styles.controlSection}>
					<Text style={[styles.sectionTitle, {color: currentTheme.colors.text}]}>Theme</Text>
					<View style={styles.buttonRow}>
						<TouchableOpacity
							style={[styles.button, themeType === 'light' && styles.activeButton]}
							onPress={() => setTheme('light')}
						>
							<Text style={styles.buttonText}>Light</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[styles.button, themeType === 'dark' && styles.activeButton]}
							onPress={() => setTheme('dark')}
						>
							<Text style={styles.buttonText}>Dark</Text>
						</TouchableOpacity>
					</View>
				</View>

				<View style={[styles.info, {backgroundColor: currentTheme.colors.background}]}>
					<Text style={[styles.infoText, {color: currentTheme.colors.textSecondary}]}>
						• Grid shows hex heights as numbers
					</Text>
					<Text style={[styles.infoText, {color: currentTheme.colors.textSecondary}]}>
						• Colors represent different heights
					</Text>
					<Text style={[styles.infoText, {color: currentTheme.colors.textSecondary}]}>
						• Grid lines separate hexagons
					</Text>
				</View>
			</ScrollView>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		padding: 20,
		paddingTop: 60,
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
	},
	canvasContainer: {
		flex: 1,
		margin: 10,
		borderRadius: 10,
		overflow: 'hidden',
		shadowColor: '#000',
		shadowOffset: {width: 0, height: 2},
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 5,
	},
	canvas: {
		flex: 1,
	},
	controls: {
		maxHeight: 300,
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		padding: 20,
	},
	controlSection: {
		marginBottom: 20,
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 10,
	},
	buttonRow: {
		flexDirection: 'row',
		gap: 10,
	},
	button: {
		backgroundColor: '#007AFF',
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 8,
		minWidth: 60,
		alignItems: 'center',
	},
	activeButton: {
		backgroundColor: '#34C759',
	},
	buttonText: {
		color: '#fff',
		fontWeight: '600',
		fontSize: 16,
	},
	info: {
		marginTop: 20,
		padding: 15,
		borderRadius: 10,
	},
	infoText: {
		fontSize: 14,
		marginBottom: 5,
	},
});
