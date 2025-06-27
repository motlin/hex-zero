/**
 * Demo screen to test basic hex grid rendering with Skia
 */

import React, {useState} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import {Canvas} from '@shopify/react-native-skia';
import {SkiaHexRenderer} from '../renderer/SkiaHexRenderer';
import {HexGrid} from '../state/HexGrid';

export const HexGridDemo: React.FC = () => {
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
	const [theme, setTheme] = useState<'light' | 'dark'>('dark');
	const [scale, setScale] = useState(1);

	return (
		<View style={[styles.container, theme === 'dark' && styles.darkContainer]}>
			<View style={styles.header}>
				<Text style={[styles.title, theme === 'dark' && styles.darkText]}>Hex Grid Rendering Test</Text>
			</View>

			<View style={styles.canvasContainer}>
				<Canvas style={styles.canvas}>
					<SkiaHexRenderer
						grid={grid}
						hexSize={hexSize}
						offsetX={200}
						offsetY={200}
						scale={scale}
						theme={theme}
					/>
				</Canvas>
			</View>

			<ScrollView style={styles.controls}>
				<View style={styles.controlSection}>
					<Text style={[styles.sectionTitle, theme === 'dark' && styles.darkText]}>Hex Size: {hexSize}</Text>
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
					<Text style={[styles.sectionTitle, theme === 'dark' && styles.darkText]}>
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
					<Text style={[styles.sectionTitle, theme === 'dark' && styles.darkText]}>Theme</Text>
					<View style={styles.buttonRow}>
						<TouchableOpacity
							style={[styles.button, theme === 'light' && styles.activeButton]}
							onPress={() => setTheme('light')}
						>
							<Text style={styles.buttonText}>Light</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[styles.button, theme === 'dark' && styles.activeButton]}
							onPress={() => setTheme('dark')}
						>
							<Text style={styles.buttonText}>Dark</Text>
						</TouchableOpacity>
					</View>
				</View>

				<View style={styles.info}>
					<Text style={[styles.infoText, theme === 'dark' && styles.darkText]}>
						• Grid shows hex heights as numbers
					</Text>
					<Text style={[styles.infoText, theme === 'dark' && styles.darkText]}>
						• Colors represent different heights
					</Text>
					<Text style={[styles.infoText, theme === 'dark' && styles.darkText]}>
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
		backgroundColor: '#f5f5f5',
	},
	darkContainer: {
		backgroundColor: '#1a1a1a',
	},
	header: {
		padding: 20,
		paddingTop: 60,
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		color: '#000',
	},
	darkText: {
		color: '#fff',
	},
	canvasContainer: {
		flex: 1,
		margin: 10,
		borderRadius: 10,
		overflow: 'hidden',
		backgroundColor: '#fff',
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
		backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
		color: '#000',
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
		backgroundColor: 'rgba(0, 0, 0, 0.05)',
		borderRadius: 10,
	},
	infoText: {
		fontSize: 14,
		marginBottom: 5,
		color: '#666',
	},
});
