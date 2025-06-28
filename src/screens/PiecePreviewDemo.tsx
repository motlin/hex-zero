/**
 * Demo screen showcasing piece preview rendering functionality
 */

import React, {useState, useCallback} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch} from 'react-native';
import {Canvas} from '@shopify/react-native-skia';
import {PiecePreview} from '../components/PiecePreview';
import {PieceSelectionPanel} from '../components/PieceSelectionPanel';
import {PieceDragOverlay} from '../components/PieceDragOverlay';
import {DraggablePiece} from '../components/DraggablePiece';
import {SeptominoGenerator, type Piece} from '../state/SeptominoGenerator';
import {useThemeContext} from '../context/ThemeContext';
import {HexGrid} from '../state/HexGrid';
import {SkiaHexRenderer} from '../renderer/SkiaHexRenderer';

// Screen dimensions - removed unused destructuring

export const PiecePreviewDemo: React.FC = () => {
	const {theme, themeType, toggleTheme} = useThemeContext();
	const [pieces] = useState<Piece[]>(() => SeptominoGenerator.generateSet(12));
	const [selectedPieceIndex, setSelectedPieceIndex] = useState<number | null>(0);
	const [currentPage, setCurrentPage] = useState(0);
	const [showInvalid, setShowInvalid] = useState(false);
	const [showGhost, setShowGhost] = useState(true);
	const [hexSize, setHexSize] = useState(30);
	const [draggedPiece, setDraggedPiece] = useState<Piece | null>(null);
	const [dragPosition, setDragPosition] = useState({x: 0, y: 0});

	// Create a small grid for preview
	const [grid] = useState(() => new HexGrid(3));
	const selectedPiece = selectedPieceIndex !== null ? pieces[selectedPieceIndex] : null;

	const handlePieceSelect = useCallback((_piece: Piece, index: number) => {
		setSelectedPieceIndex(index);
	}, []);

	const handleDragStart = useCallback((piece: Piece, index: number) => {
		setDraggedPiece(piece);
		setSelectedPieceIndex(index);
	}, []);

	const handleDragMove = useCallback((_piece: Piece, x: number, y: number) => {
		setDragPosition({x, y});
	}, []);

	const handleDragEnd = useCallback((_piece: Piece, _x: number, _y: number) => {
		// Simulate piece placement
		setDraggedPiece(null);
	}, []);

	const resetDemo = useCallback(() => {
		setSelectedPieceIndex(0);
		setCurrentPage(0);
	}, []);

	return (
		<ScrollView style={[styles.container, {backgroundColor: theme.colors.background}]}>
			<Text style={[styles.title, {color: theme.colors.text}]}>Piece Preview Demo</Text>

			{/* Controls */}
			<View style={styles.section}>
				<Text style={[styles.sectionTitle, {color: theme.colors.text}]}>Settings</Text>

				<View style={styles.control}>
					<Text style={[styles.label, {color: theme.colors.textSecondary}]}>Theme: {themeType}</Text>
					<Switch
						value={themeType === 'dark'}
						onValueChange={toggleTheme}
						trackColor={{false: '#767577', true: theme.colors.selectionColor}}
						thumbColor={theme.colors.text}
					/>
				</View>

				<View style={styles.control}>
					<Text style={[styles.label, {color: theme.colors.textSecondary}]}>Show Invalid State</Text>
					<Switch
						value={showInvalid}
						onValueChange={setShowInvalid}
						trackColor={{false: '#767577', true: theme.colors.selectionColor}}
						thumbColor={theme.colors.text}
					/>
				</View>

				<View style={styles.control}>
					<Text style={[styles.label, {color: theme.colors.textSecondary}]}>Show Ghost</Text>
					<Switch
						value={showGhost}
						onValueChange={setShowGhost}
						trackColor={{false: '#767577', true: theme.colors.selectionColor}}
						thumbColor={theme.colors.text}
					/>
				</View>

				<View style={styles.control}>
					<Text style={[styles.label, {color: theme.colors.textSecondary}]}>Hex Size: {hexSize}</Text>
					<View style={styles.buttonGroup}>
						<TouchableOpacity
							style={[styles.button, {backgroundColor: theme.colors.surface}]}
							onPress={() => setHexSize(Math.max(10, hexSize - 5))}
						>
							<Text style={{color: theme.colors.text}}>-</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[styles.button, {backgroundColor: theme.colors.surface}]}
							onPress={() => setHexSize(Math.min(50, hexSize + 5))}
						>
							<Text style={{color: theme.colors.text}}>+</Text>
						</TouchableOpacity>
					</View>
				</View>
			</View>

			{/* Basic Piece Preview */}
			<View style={styles.section}>
				<Text style={[styles.sectionTitle, {color: theme.colors.text}]}>Basic Piece Preview</Text>
				<View style={[styles.previewBox, {backgroundColor: theme.colors.surface}]}>
					{selectedPiece && (
						<PiecePreview
							piece={selectedPiece}
							hexSize={hexSize}
							width={200}
							height={200}
							isInvalid={showInvalid}
							showGhost={showGhost}
						/>
					)}
				</View>
			</View>

			{/* Draggable Piece */}
			<View style={styles.section}>
				<Text style={[styles.sectionTitle, {color: theme.colors.text}]}>Draggable Piece</Text>
				<View style={[styles.previewBox, {backgroundColor: theme.colors.surface}]}>
					{selectedPiece && (
						<DraggablePiece
							piece={selectedPiece}
							index={selectedPieceIndex || 0}
							hexSize={hexSize}
							onDragStart={handleDragStart}
							onDragMove={handleDragMove}
							onDragEnd={handleDragEnd}
							isPlaced={false}
						/>
					)}
				</View>
			</View>

			{/* Piece Selection Panel */}
			<View style={styles.section}>
				<Text style={[styles.sectionTitle, {color: theme.colors.text}]}>Piece Selection Panel</Text>
				<View style={[styles.panelContainer, {backgroundColor: theme.colors.surface}]}>
					<PieceSelectionPanel
						pieces={pieces}
						currentPage={currentPage}
						piecesPerPage={4}
						onPieceSelect={handlePieceSelect}
						onPieceDragStart={handleDragStart}
						onPieceDragMove={handleDragMove}
						onPieceDragEnd={handleDragEnd}
						onPageChange={setCurrentPage}
						selectedPieceIndex={selectedPieceIndex}
						hexSize={hexSize}
					/>
				</View>
			</View>

			{/* Grid with Piece Preview */}
			<View style={styles.section}>
				<Text style={[styles.sectionTitle, {color: theme.colors.text}]}>Grid with Piece Preview</Text>
				<View style={[styles.gridContainer, {backgroundColor: theme.colors.surface}]}>
					<Canvas style={styles.canvas}>
						<SkiaHexRenderer
							grid={grid}
							hexSize={hexSize}
							offsetX={150}
							offsetY={150}
							theme={themeType}
							selectedPiece={selectedPiece}
							hoveredHex={{q: 0, r: 0}}
						/>
					</Canvas>
				</View>
			</View>

			<TouchableOpacity
				style={[styles.resetButton, {backgroundColor: theme.colors.burstColor}]}
				onPress={resetDemo}
			>
				<Text style={[styles.resetButtonText, {color: theme.colors.surface}]}>Reset Demo</Text>
			</TouchableOpacity>

			{/* Drag Overlay */}
			<PieceDragOverlay
				piece={draggedPiece}
				position={dragPosition}
				isValid={!showInvalid}
				visible={!!draggedPiece}
				hexSize={hexSize}
			/>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		textAlign: 'center',
		marginVertical: 20,
	},
	section: {
		marginHorizontal: 20,
		marginBottom: 30,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: '600',
		marginBottom: 15,
	},
	control: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 15,
	},
	label: {
		fontSize: 16,
	},
	buttonGroup: {
		flexDirection: 'row',
		gap: 10,
	},
	button: {
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 5,
	},
	previewBox: {
		height: 200,
		borderRadius: 10,
		justifyContent: 'center',
		alignItems: 'center',
		overflow: 'hidden',
	},
	panelContainer: {
		borderRadius: 10,
		overflow: 'hidden',
	},
	gridContainer: {
		height: 300,
		borderRadius: 10,
		overflow: 'hidden',
	},
	canvas: {
		flex: 1,
	},
	resetButton: {
		marginHorizontal: 20,
		marginVertical: 30,
		paddingVertical: 15,
		borderRadius: 10,
		alignItems: 'center',
	},
	resetButtonText: {
		fontSize: 16,
		fontWeight: 'bold',
	},
});
