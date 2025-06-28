/**
 * Main game board component that integrates game state with rendering
 * Provides complete game board functionality with proper state management
 */

import React, {useState, useCallback, useEffect} from 'react';
import {View, StyleSheet, LayoutChangeEvent} from 'react-native';
import {HexGameBoardWithGestures} from './HexGameBoardWithGestures';
import {useGameState} from '../contexts/GameStateContext';
import {useThemeContext} from '../context/ThemeContext';
import type {HexPoint} from '../utils/hex-calculations';
import type {Piece} from '../state/SeptominoGenerator';

interface GameBoardProps {
	showHints?: boolean;
	onBoardReady?: () => void;
}

// Screen dimensions can be accessed if needed for future enhancements

export const GameBoard: React.FC<GameBoardProps> = ({showHints = false, onBoardReady}) => {
	const {themeType} = useThemeContext();
	const {gameState, placePiece, canPlacePiece, getCurrentPiece, getSolutionHint, incrementHintCount} = useGameState();

	const [hintCells, setHintCells] = useState<HexPoint[]>([]);
	const [lastHintRequest, setLastHintRequest] = useState<number>(0);

	// Get current piece
	const currentPiece = getCurrentPiece();

	// Handle layout changes for responsiveness
	const handleLayout = useCallback((_event: LayoutChangeEvent) => {
		// Reserved for future use when we need dynamic sizing
	}, []);

	// Calculate hint cells when hints are shown
	useEffect(() => {
		if (showHints && gameState && currentPiece) {
			// Throttle hint requests to avoid excessive computation
			const now = Date.now();
			if (now - lastHintRequest < 1000) return;

			const hint = getSolutionHint();
			if (hint) {
				// Show all valid placement positions for the current piece
				const validPositions: HexPoint[] = [];
				gameState.getGrid().forEachHex((q, r) => {
					if (canPlacePiece(currentPiece, q, r)) {
						validPositions.push({q, r});
					}
				});

				// If we have a specific hint, highlight it differently
				if (hint && validPositions.some((pos) => pos.q === hint.q && pos.r === hint.r)) {
					setHintCells([hint]);
				} else {
					// Show up to 3 hints
					setHintCells(validPositions.slice(0, 3));
				}

				incrementHintCount();
				setLastHintRequest(now);
			} else {
				setHintCells([]);
			}
		} else {
			setHintCells([]);
		}
	}, [showHints, gameState, currentPiece, getSolutionHint, canPlacePiece, incrementHintCount, lastHintRequest]);

	// Handle hex press (for debugging or future features)
	const handleHexPress = useCallback(
		(_hex: HexPoint) => {
			if (!gameState || !currentPiece) return;

			// In the future, this could be used for:
			// - Manual hint placement
			// - Hex information display
			// - Debug features
			// console.log(`Hex pressed: (${_hex.q}, ${_hex.r})`); // Debug only
		},
		[gameState, currentPiece],
	);

	// Handle piece placement
	const handlePiecePlaced = useCallback(
		(_piece: Piece, position: HexPoint) => {
			if (!gameState) return;

			// Place the piece through game state
			const success = placePiece(position.q, position.r);

			if (success) {
				// Clear hints after successful placement
				setHintCells([]);

				// Check for game completion
				if (gameState.isGameWon()) {
					// Game won logic will be handled by parent component
					// console.log('Game won!'); // Debug only
				}
			}
		},
		[gameState, placePiece],
	);

	// Notify parent when board is ready
	useEffect(() => {
		if (gameState && onBoardReady) {
			onBoardReady();
		}
	}, [gameState, onBoardReady]);

	// Don't render until game state is initialized
	if (!gameState) {
		return null;
	}

	const grid = gameState.getGrid();

	return (
		<View
			style={styles.container}
			onLayout={handleLayout}
		>
			<HexGameBoardWithGestures
				grid={grid}
				selectedPiece={currentPiece}
				onHexPress={handleHexPress}
				onPiecePlaced={handlePiecePlaced}
				showHints={showHints}
				hintCells={hintCells}
				theme={themeType}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});
