/**
 * Demo component to showcase Skia hex renderer features
 * Useful for testing and development
 */

import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch} from 'react-native';
import {HexGameBoard} from './HexGameBoard';
import {HexGrid} from '../state/HexGrid';
import {SeptominoGenerator, type Piece} from '../state/SeptominoGenerator';
import type {HexPoint} from '../utils/hex-calculations';

export const HexRendererDemo: React.FC = () => {
	const [gridRadius] = useState(4);
	const [grid] = useState(() => {
		const newGrid = new HexGrid(gridRadius);
		// Initialize with some random heights
		newGrid.forEachHex((q, r) => {
			const distance = Math.abs(q) + Math.abs(q + r) + Math.abs(r);
			const height = Math.max(0, Math.floor(Math.random() * 11 - distance));
			const hex = newGrid.getHex(q, r);
			if (hex) {
				hex.height = height;
			}
		});
		return newGrid;
	});

	const [pieces] = useState(() => SeptominoGenerator.generateSet(6));
	const [selectedPieceIndex, setSelectedPieceIndex] = useState(0);
	const [showHints, setShowHints] = useState(false);
	const [theme, setTheme] = useState<'light' | 'dark'>('dark');
	const [hintCells, setHintCells] = useState<HexPoint[]>([]);

	const selectedPiece = pieces[selectedPieceIndex];

	const handleHexPress = (hex: HexPoint) => {
		// Hex pressed: hex
		// Toggle hint for this hex
		const isHinted = hintCells.some((h) => h.q === hex.q && h.r === hex.r);
		if (isHinted) {
			setHintCells(hintCells.filter((h) => !(h.q === hex.q && h.r === hex.r)));
		} else {
			setHintCells([...hintCells, hex]);
		}
	};

	const handlePiecePlaced = (piece: Piece, position: HexPoint) => {
		// Piece placed at: position
		// Update grid heights
		piece.tiles.forEach((tile) => {
			const worldQ = position.q + tile.q - piece.center.q;
			const worldR = position.r + tile.r - piece.center.r;
			const hex = grid.getHex(worldQ, worldR);
			if (hex && hex.height > 0) {
				hex.height -= 1;
			}
		});

		// Move to next piece
		setSelectedPieceIndex((selectedPieceIndex + 1) % pieces.length);
	};

	const resetGrid = () => {
		grid.forEachHex((q, r) => {
			const distance = Math.abs(q) + Math.abs(q + r) + Math.abs(r);
			const height = Math.max(0, Math.floor(Math.random() * 11 - distance));
			const hex = grid.getHex(q, r);
			if (hex) {
				hex.height = height;
			}
		});
		setHintCells([]);
	};

	return (
		<View style={styles.container}>
			<View style={styles.gameArea}>
				<HexGameBoard
					grid={grid}
					selectedPiece={selectedPiece}
					onHexPress={handleHexPress}
					onPiecePlaced={handlePiecePlaced}
					showHints={showHints}
					hintCells={hintCells}
					theme={theme}
				/>
			</View>

			<View style={styles.controls}>
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
				>
					<View style={styles.controlsContent}>
						<View style={styles.controlSection}>
							<Text style={styles.sectionTitle}>Theme</Text>
							<View style={styles.switchRow}>
								<Text style={styles.switchLabel}>Dark</Text>
								<Switch
									value={theme === 'dark'}
									onValueChange={(value) => setTheme(value ? 'dark' : 'light')}
								/>
							</View>
						</View>

						<View style={styles.controlSection}>
							<Text style={styles.sectionTitle}>Hints</Text>
							<View style={styles.switchRow}>
								<Text style={styles.switchLabel}>Show</Text>
								<Switch
									value={showHints}
									onValueChange={setShowHints}
								/>
							</View>
						</View>

						<View style={styles.controlSection}>
							<Text style={styles.sectionTitle}>Pieces</Text>
							<View style={styles.pieceButtons}>
								{pieces.map((_, index) => (
									<TouchableOpacity
										key={index}
										style={[
											styles.pieceButton,
											selectedPieceIndex === index && styles.selectedPiece,
										]}
										onPress={() => setSelectedPieceIndex(index)}
									>
										<Text style={styles.pieceButtonText}>{index + 1}</Text>
									</TouchableOpacity>
								))}
							</View>
						</View>

						<View style={styles.controlSection}>
							<TouchableOpacity
								style={styles.resetButton}
								onPress={resetGrid}
							>
								<Text style={styles.resetButtonText}>Reset Grid</Text>
							</TouchableOpacity>
						</View>
					</View>
				</ScrollView>
			</View>

			<View style={styles.info}>
				<Text style={styles.infoText}>• Double tap to reset view</Text>
				<Text style={styles.infoText}>• Pinch to zoom</Text>
				<Text style={styles.infoText}>• Drag to pan</Text>
				<Text style={styles.infoText}>• Tap hex to toggle hint</Text>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#000',
	},
	gameArea: {
		flex: 1,
	},
	controls: {
		height: 120,
		backgroundColor: '#222',
		borderTopWidth: 1,
		borderTopColor: '#444',
	},
	controlsContent: {
		flexDirection: 'row',
		padding: 10,
		gap: 20,
	},
	controlSection: {
		paddingHorizontal: 10,
	},
	sectionTitle: {
		color: '#fff',
		fontSize: 14,
		fontWeight: 'bold',
		marginBottom: 8,
	},
	switchRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	switchLabel: {
		color: '#ccc',
		fontSize: 12,
	},
	pieceButtons: {
		flexDirection: 'row',
		gap: 8,
	},
	pieceButton: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: '#444',
		justifyContent: 'center',
		alignItems: 'center',
	},
	selectedPiece: {
		backgroundColor: '#0066cc',
	},
	pieceButtonText: {
		color: '#fff',
		fontSize: 14,
		fontWeight: 'bold',
	},
	resetButton: {
		backgroundColor: '#cc0000',
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 4,
	},
	resetButtonText: {
		color: '#fff',
		fontSize: 14,
		fontWeight: 'bold',
	},
	info: {
		position: 'absolute',
		top: 40,
		left: 10,
		backgroundColor: 'rgba(0, 0, 0, 0.7)',
		padding: 10,
		borderRadius: 8,
	},
	infoText: {
		color: '#ccc',
		fontSize: 12,
		marginBottom: 2,
	},
});
