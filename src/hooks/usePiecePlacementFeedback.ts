/**
 * Hook for piece placement feedback system
 * Manages visual feedback, shake animations, and valid placement highlighting
 */

import {useState, useCallback, useRef} from 'react';
import type {Piece} from '../state/SeptominoGenerator';
import type {HexPoint} from '../utils/hex-calculations';
import {useGameState} from '../contexts/GameStateContext';

export interface PlacementFeedbackState {
	// Valid placement areas during drag
	validPlacements: HexPoint[];
	// Current drag feedback
	draggedPiece: Piece | null;
	dropPosition: {x: number; y: number} | null;
	// Invalid placement feedback
	isShowingInvalidFeedback: boolean;
}

export interface PiecePlacementFeedbackHooks {
	// State
	feedbackState: PlacementFeedbackState;

	// Actions
	startDrag: (piece: Piece, x: number, y: number) => void;
	updateDrag: (piece: Piece, x: number, y: number) => void;
	endDrag: (piece: Piece, x: number, y: number) => boolean;
	showInvalidPlacement: (piece: Piece, index: number) => void;
	clearFeedback: () => void;

	// Placement validation
	getValidPlacements: (piece: Piece) => HexPoint[];
	canPlaceAt: (piece: Piece, position: HexPoint) => boolean;
}

export function usePiecePlacementFeedback(): PiecePlacementFeedbackHooks {
	const {gameState, canPlacePiece} = useGameState();

	const [feedbackState, setFeedbackState] = useState<PlacementFeedbackState>({
		validPlacements: [],
		draggedPiece: null,
		dropPosition: null,
		isShowingInvalidFeedback: false,
	});

	const invalidFeedbackTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

	const getValidPlacements = useCallback(
		(piece: Piece): HexPoint[] => {
			if (!gameState) return [];

			const validPositions: HexPoint[] = [];
			gameState.getGrid().forEachHex((q, r) => {
				if (canPlacePiece(piece, q, r)) {
					validPositions.push({q, r});
				}
			});

			return validPositions;
		},
		[gameState, canPlacePiece],
	);

	const canPlaceAt = useCallback(
		(piece: Piece, position: HexPoint): boolean => {
			if (!gameState) return false;
			return canPlacePiece(piece, position.q, position.r);
		},
		[gameState, canPlacePiece],
	);

	const startDrag = useCallback(
		(piece: Piece, x: number, y: number) => {
			const validPlacements = getValidPlacements(piece);

			setFeedbackState((prev) => ({
				...prev,
				validPlacements,
				draggedPiece: piece,
				dropPosition: {x, y},
				isShowingInvalidFeedback: false,
			}));
		},
		[getValidPlacements],
	);

	const updateDrag = useCallback((piece: Piece, x: number, y: number) => {
		setFeedbackState((prev) => ({
			...prev,
			draggedPiece: piece,
			dropPosition: {x, y},
		}));
	}, []);

	const endDrag = useCallback((_piece: Piece, _x: number, _y: number): boolean => {
		// This will be handled by the GameBoard component's drop logic
		// Just clear the drag state here
		setFeedbackState((prev) => ({
			...prev,
			draggedPiece: null,
			dropPosition: null,
			validPlacements: [],
		}));

		// Return false to indicate we don't handle placement here
		return false;
	}, []);

	const showInvalidPlacement = useCallback((_piece: Piece, _index: number) => {
		// Clear any existing timeout
		if (invalidFeedbackTimeout.current) {
			clearTimeout(invalidFeedbackTimeout.current);
		}

		setFeedbackState((prev) => ({
			...prev,
			isShowingInvalidFeedback: true,
		}));

		// Clear the invalid feedback after a short duration
		invalidFeedbackTimeout.current = setTimeout(() => {
			setFeedbackState((prev) => ({
				...prev,
				isShowingInvalidFeedback: false,
			}));
		}, 500);
	}, []);

	const clearFeedback = useCallback(() => {
		if (invalidFeedbackTimeout.current) {
			clearTimeout(invalidFeedbackTimeout.current);
		}

		setFeedbackState({
			validPlacements: [],
			draggedPiece: null,
			dropPosition: null,
			isShowingInvalidFeedback: false,
		});
	}, []);

	return {
		feedbackState,
		startDrag,
		updateDrag,
		endDrag,
		showInvalidPlacement,
		clearFeedback,
		getValidPlacements,
		canPlaceAt,
	};
}
