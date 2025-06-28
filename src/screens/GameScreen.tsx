/**
 * Main game screen that combines all game elements
 * Includes game board, piece selection, and game controls
 */

import React, {useState, useCallback, useEffect} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView, ActivityIndicator} from 'react-native';
import {GameBoard} from '../components/GameBoard';
import {PieceSelectionPanel} from '../components/PieceSelectionPanel';
import {PieceDragOverlay} from '../components/PieceDragOverlay';
import {useGameState} from '../contexts/GameStateContext';
import {useThemeContext} from '../context/ThemeContext';
import {usePiecePlacementFeedback} from '../hooks/usePiecePlacementFeedback';
import type {Piece} from '../state/SeptominoGenerator';

interface GameScreenProps {
	onBackToMenu?: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({onBackToMenu}) => {
	const {theme} = useThemeContext();
	const {
		gameState,
		isLoading,
		setCurrentPieceIndex,
		currentPieceIndex,
		isGameWon,
		getMoveCount,
		getHintCount,
		undo,
		redo,
		restart,
		canUndo,
		canRedo,
	} = useGameState();

	const {feedbackState, startDrag, updateDrag, endDrag, showInvalidPlacement, clearFeedback} =
		usePiecePlacementFeedback();

	const [showHints, setShowHints] = useState(false);
	const [currentPage, setCurrentPage] = useState(0);
	const [boardReady, setBoardReady] = useState(false);

	// Drag state
	const [draggedPiece, setDraggedPiece] = useState<Piece | null>(null);
	const [, setDraggedPieceIndex] = useState<number | null>(null);
	const [dragPosition, setDragPosition] = useState({x: 0, y: 0});
	const [dropPosition, setDropPosition] = useState<{x: number; y: number} | null>(null);

	const pieces = gameState?.getPieces() || [];
	const moveCount = getMoveCount();
	const hintCount = getHintCount();
	const gameWon = isGameWon();

	// Check for game completion
	useEffect(() => {
		if (gameWon && boardReady) {
			setTimeout(() => {
				Alert.alert(
					'🎉 Congratulations!',
					`You completed the puzzle!\n\nMoves: ${moveCount}\nHints used: ${hintCount}`,
					[
						{text: 'New Game', onPress: handleNewGame},
						{text: 'OK', style: 'cancel'},
					],
				);
			}, 500);
		}
	}, [gameWon, boardReady, moveCount, hintCount]);

	// Handle piece selection from panel
	const handlePieceSelect = useCallback(
		(_piece: Piece, index: number) => {
			setCurrentPieceIndex(index);
		},
		[setCurrentPieceIndex],
	);

	// Handle drag start
	const handleDragStart = useCallback(
		(piece: Piece, index: number) => {
			setDraggedPiece(piece);
			setDraggedPieceIndex(index);
			setCurrentPieceIndex(index);
			startDrag(piece, dragPosition.x, dragPosition.y);
		},
		[setCurrentPieceIndex, startDrag, dragPosition],
	);

	// Handle drag move
	const handleDragMove = useCallback(
		(piece: Piece, x: number, y: number) => {
			setDragPosition({x, y});
			updateDrag(piece, x, y);
		},
		[updateDrag],
	);

	// Handle drag end
	const handleDragEnd = useCallback(
		(piece: Piece, x: number, y: number) => {
			// Set the drop position to trigger placement in GameBoard
			setDropPosition({x, y});
			endDrag(piece, x, y);

			// The drag overlay will be cleared after drop is processed
		},
		[endDrag],
	);

	// Handle invalid placement for shake animation from board
	const handleBoardInvalidPlacement = useCallback(
		(piece: Piece) => {
			// Find the piece index to trigger shake animation
			const pieceIndex = pieces.findIndex((p) => p === piece);
			if (pieceIndex !== -1) {
				showInvalidPlacement(piece, pieceIndex);
			}
		},
		[pieces, showInvalidPlacement],
	);

	// Handle invalid placement for shake animation from piece panel
	const handlePieceInvalidPlacement = useCallback(
		(piece: Piece, index: number) => {
			showInvalidPlacement(piece, index);
		},
		[showInvalidPlacement],
	);

	// Handle drop complete callback from GameBoard
	const handleDropComplete = useCallback(() => {
		// Clear drag state after drop is processed
		clearFeedback();
		setDraggedPiece(null);
		setDraggedPieceIndex(null);
		setDropPosition(null);
	}, [clearFeedback]);

	// Handle hint toggle
	const handleHintToggle = useCallback(() => {
		setShowHints(!showHints);
		if (!showHints) {
			Alert.alert('Hint', 'Valid placement positions will be highlighted on the board.', [{text: 'OK'}]);
		}
	}, [showHints]);

	// Handle undo
	const handleUndo = useCallback(() => {
		if (undo()) {
			// Successfully undone
		}
	}, [undo]);

	// Handle redo
	const handleRedo = useCallback(() => {
		if (redo()) {
			// Successfully redone
		}
	}, [redo]);

	// Handle restart
	const handleRestart = useCallback(() => {
		Alert.alert('Restart Game', 'Are you sure you want to restart the current game?', [
			{text: 'Cancel', style: 'cancel'},
			{text: 'Restart', style: 'destructive', onPress: restart},
		]);
	}, [restart]);

	// Handle new game
	const handleNewGame = useCallback(() => {
		if (onBackToMenu) {
			onBackToMenu();
		} else {
			restart();
		}
	}, [onBackToMenu, restart]);

	// Handle back to menu
	const handleBackToMenu = useCallback(() => {
		Alert.alert('Exit Game', 'Are you sure you want to exit to the menu? Your progress will be lost.', [
			{text: 'Cancel', style: 'cancel'},
			{text: 'Exit', style: 'destructive', onPress: onBackToMenu},
		]);
	}, [onBackToMenu]);

	if (isLoading) {
		return (
			<View style={[styles.loadingContainer, {backgroundColor: theme.colors.background}]}>
				<ActivityIndicator
					size="large"
					color={theme.colors.text}
				/>
				<Text style={[styles.loadingText, {color: theme.colors.text}]}>Generating puzzle...</Text>
			</View>
		);
	}

	if (!gameState) {
		return (
			<View style={[styles.errorContainer, {backgroundColor: theme.colors.background}]}>
				<Text style={[styles.errorText, {color: theme.colors.text}]}>Error: Game not initialized</Text>
				<TouchableOpacity
					style={[styles.button, {backgroundColor: theme.colors.surface}]}
					onPress={onBackToMenu}
				>
					<Text style={[styles.buttonText, {color: theme.colors.text}]}>Back to Menu</Text>
				</TouchableOpacity>
			</View>
		);
	}

	return (
		<SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]}>
			{/* Header */}
			<View style={[styles.header, {backgroundColor: theme.colors.surface}]}>
				<TouchableOpacity
					onPress={handleBackToMenu}
					style={styles.headerButton}
				>
					<Text style={[styles.headerButtonText, {color: theme.colors.text}]}>← Menu</Text>
				</TouchableOpacity>

				<View style={styles.stats}>
					<Text style={[styles.statText, {color: theme.colors.textSecondary}]}>Moves: {moveCount}</Text>
					<Text style={[styles.statText, {color: theme.colors.textSecondary}]}>Hints: {hintCount}</Text>
				</View>

				<TouchableOpacity
					onPress={handleRestart}
					style={styles.headerButton}
				>
					<Text style={[styles.headerButtonText, {color: theme.colors.text}]}>Restart</Text>
				</TouchableOpacity>
			</View>

			{/* Game Board */}
			<View style={styles.gameBoard}>
				<GameBoard
					showHints={showHints}
					onBoardReady={() => setBoardReady(true)}
					draggedPiece={draggedPiece}
					dropPosition={dropPosition}
					onDropComplete={handleDropComplete}
					onInvalidPlacement={handleBoardInvalidPlacement}
					validPlacementCells={feedbackState.validPlacements}
				/>
			</View>

			{/* Control Buttons */}
			<View style={[styles.controls, {backgroundColor: theme.colors.surface}]}>
				<TouchableOpacity
					style={[
						styles.controlButton,
						!canUndo() && styles.disabledButton,
						{backgroundColor: theme.colors.background},
					]}
					onPress={handleUndo}
					disabled={!canUndo()}
				>
					<Text style={[styles.controlButtonText, {color: theme.colors.text}]}>↶ Undo</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={[
						styles.controlButton,
						showHints && styles.activeButton,
						{backgroundColor: showHints ? theme.colors.burstColor : theme.colors.background},
					]}
					onPress={handleHintToggle}
				>
					<Text
						style={[
							styles.controlButtonText,
							{color: showHints ? theme.colors.surface : theme.colors.text},
						]}
					>
						💡 Hint
					</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={[
						styles.controlButton,
						!canRedo() && styles.disabledButton,
						{backgroundColor: theme.colors.background},
					]}
					onPress={handleRedo}
					disabled={!canRedo()}
				>
					<Text style={[styles.controlButtonText, {color: theme.colors.text}]}>↷ Redo</Text>
				</TouchableOpacity>
			</View>

			{/* Piece Selection */}
			<View style={[styles.piecePanel, {backgroundColor: theme.colors.surface}]}>
				<PieceSelectionPanel
					pieces={pieces}
					currentPage={currentPage}
					piecesPerPage={4}
					onPieceSelect={handlePieceSelect}
					onPieceDragStart={handleDragStart}
					onPieceDragMove={handleDragMove}
					onPieceDragEnd={handleDragEnd}
					onInvalidPlacement={handlePieceInvalidPlacement}
					onPageChange={setCurrentPage}
					selectedPieceIndex={currentPieceIndex}
					hexSize={25}
				/>
			</View>

			{/* Drag Overlay */}
			<PieceDragOverlay
				piece={draggedPiece}
				position={dragPosition}
				// This would be determined by the board position
				isValid={true}
				visible={!!draggedPiece}
				hexSize={30}
			/>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	loadingText: {
		marginTop: 20,
		fontSize: 16,
	},
	errorContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	errorText: {
		fontSize: 18,
		marginBottom: 20,
		textAlign: 'center',
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 15,
		paddingVertical: 10,
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(0, 0, 0, 0.1)',
	},
	headerButton: {
		padding: 5,
	},
	headerButtonText: {
		fontSize: 16,
		fontWeight: '600',
	},
	stats: {
		flexDirection: 'row',
		gap: 20,
	},
	statText: {
		fontSize: 14,
	},
	gameBoard: {
		flex: 1,
	},
	controls: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		paddingVertical: 10,
		paddingHorizontal: 20,
		borderTopWidth: 1,
		borderTopColor: 'rgba(0, 0, 0, 0.1)',
	},
	controlButton: {
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 20,
		minWidth: 80,
		alignItems: 'center',
	},
	controlButtonText: {
		fontSize: 14,
		fontWeight: '600',
	},
	activeButton: {
		opacity: 1,
	},
	disabledButton: {
		opacity: 0.5,
	},
	piecePanel: {
		borderTopWidth: 1,
		borderTopColor: 'rgba(0, 0, 0, 0.1)',
	},
	button: {
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 5,
	},
	buttonText: {
		fontSize: 16,
		fontWeight: '600',
	},
});
