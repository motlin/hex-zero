import React, {createContext, useContext, useState, useCallback, useMemo} from 'react';
import {GameState, type GameSettings} from '../state/GameState';
import type {HexCoordinate} from '../state/HexGrid';
import type {Piece} from '../state/SeptominoGenerator';

interface GameStateContextValue {
	gameState: GameState | null;
	isLoading: boolean;

	// Game initialization
	initializeGame: (radius: number, numPieces: number) => void;

	// Piece placement
	placePiece: (centerQ: number, centerR: number) => boolean;
	canPlacePiece: (piece: Piece, centerQ: number, centerR: number) => boolean;

	// Piece selection
	currentPieceIndex: number;
	setCurrentPieceIndex: (index: number) => void;
	cyclePiece: (direction: number) => boolean;
	getNextPieceIndex: () => number | null;
	getPreviousPieceIndex: () => number | null;

	// Game state queries
	isGameWon: () => boolean;
	isPiecePlaced: (index: number) => boolean;
	getAllPiecesPlaced: () => boolean;
	getCurrentPiece: () => Piece | null;
	getPieceByIndex: (index: number) => Piece | null;
	getPlacedPieces: () => Set<number>;

	// Game actions
	undo: () => boolean;
	redo: () => boolean;
	restart: () => void;
	getSolutionHint: () => HexCoordinate | null;

	// Statistics
	getMoveCount: () => number;
	getUndoCount: () => number;
	getHintCount: () => number;
	incrementHintCount: () => void;

	// Game info
	getDifficulty: () => string;
	getSettings: () => GameSettings | null;

	// Undo/Redo state
	canUndo: () => boolean;
	canRedo: () => boolean;
}

const GameStateContext = createContext<GameStateContextValue | undefined>(undefined);

export function GameStateProvider({children}: {children: React.ReactNode}) {
	const [gameState, setGameState] = useState<GameState | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [currentPieceIndex, setCurrentPieceIndexState] = useState(0);

	const initializeGame = useCallback((radius: number, numPieces: number) => {
		setIsLoading(true);
		try {
			const newGameState = new GameState(radius, numPieces);
			setGameState(newGameState);
			setCurrentPieceIndexState(newGameState.getCurrentPieceIndex());
		} finally {
			setIsLoading(false);
		}
	}, []);

	const placePiece = useCallback(
		(centerQ: number, centerR: number): boolean => {
			if (!gameState) return false;
			const result = gameState.placePiece(centerQ, centerR);
			if (result) {
				setCurrentPieceIndexState(gameState.getCurrentPieceIndex());
			}
			return result;
		},
		[gameState],
	);

	const canPlacePiece = useCallback(
		(piece: Piece, centerQ: number, centerR: number): boolean => {
			if (!gameState) return false;
			return gameState.canPlacePiece(piece, centerQ, centerR);
		},
		[gameState],
	);

	const setCurrentPieceIndex = useCallback(
		(index: number) => {
			if (!gameState) return;
			gameState.setCurrentPieceIndex(index);
			setCurrentPieceIndexState(index);
		},
		[gameState],
	);

	const cyclePiece = useCallback(
		(direction: number): boolean => {
			if (!gameState) return false;
			const result = gameState.cyclePiece(direction);
			if (result) {
				setCurrentPieceIndexState(gameState.getCurrentPieceIndex());
			}
			return result;
		},
		[gameState],
	);

	const getNextPieceIndex = useCallback((): number | null => {
		if (!gameState) return null;
		return gameState.getNextPieceIndex();
	}, [gameState]);

	const getPreviousPieceIndex = useCallback((): number | null => {
		if (!gameState) return null;
		return gameState.getPreviousPieceIndex();
	}, [gameState]);

	const isGameWon = useCallback((): boolean => {
		if (!gameState) return false;
		return gameState.isGameWon();
	}, [gameState]);

	const isPiecePlaced = useCallback(
		(index: number): boolean => {
			if (!gameState) return false;
			return gameState.isPiecePlaced(index);
		},
		[gameState],
	);

	const getAllPiecesPlaced = useCallback((): boolean => {
		if (!gameState) return false;
		return gameState.getAllPiecesPlaced();
	}, [gameState]);

	const getCurrentPiece = useCallback((): Piece | null => {
		if (!gameState) return null;
		return gameState.getCurrentPiece();
	}, [gameState]);

	const getPieceByIndex = useCallback(
		(index: number): Piece | null => {
			if (!gameState) return null;
			return gameState.getPieceByIndex(index);
		},
		[gameState],
	);

	const getPlacedPieces = useCallback((): Set<number> => {
		if (!gameState) return new Set();
		return gameState.getPlacedPieces();
	}, [gameState]);

	const undo = useCallback((): boolean => {
		if (!gameState) return false;
		const result = gameState.undo();
		if (result) {
			setCurrentPieceIndexState(gameState.getCurrentPieceIndex());
		}
		return result;
	}, [gameState]);

	const redo = useCallback((): boolean => {
		if (!gameState) return false;
		const result = gameState.redo();
		if (result) {
			setCurrentPieceIndexState(gameState.getCurrentPieceIndex());
		}
		return result;
	}, [gameState]);

	const restart = useCallback(() => {
		if (!gameState) return;

		// Get current game settings
		const radius = gameState.getGrid().radius;
		const numPieces = gameState.getPieces().length;

		// Create a new game with same settings
		initializeGame(radius, numPieces);
	}, [gameState, initializeGame]);

	const getSolutionHint = useCallback((): HexCoordinate | null => {
		if (!gameState) return null;
		return gameState.getSolutionHint();
	}, [gameState]);

	const getMoveCount = useCallback((): number => {
		if (!gameState) return 0;
		return gameState.getMoveCount();
	}, [gameState]);

	const getUndoCount = useCallback((): number => {
		if (!gameState) return 0;
		return gameState.getUndoCount();
	}, [gameState]);

	const getHintCount = useCallback((): number => {
		if (!gameState) return 0;
		return gameState.getHintCount();
	}, [gameState]);

	const incrementHintCount = useCallback(() => {
		if (!gameState) return;
		gameState.incrementHintCount();
	}, [gameState]);

	const getDifficulty = useCallback((): string => {
		if (!gameState) return 'Unknown';
		return gameState.getDifficulty();
	}, [gameState]);

	const getSettings = useCallback((): GameSettings | null => {
		if (!gameState) return null;
		return gameState.getSettings();
	}, [gameState]);

	const canUndo = useCallback((): boolean => {
		if (!gameState) return false;
		return gameState.canUndo();
	}, [gameState]);

	const canRedo = useCallback((): boolean => {
		if (!gameState) return false;
		return gameState.canRedo();
	}, [gameState]);

	const value = useMemo<GameStateContextValue>(
		() => ({
			gameState,
			isLoading,
			initializeGame,
			placePiece,
			canPlacePiece,
			currentPieceIndex,
			setCurrentPieceIndex,
			cyclePiece,
			getNextPieceIndex,
			getPreviousPieceIndex,
			isGameWon,
			isPiecePlaced,
			getAllPiecesPlaced,
			getCurrentPiece,
			getPieceByIndex,
			getPlacedPieces,
			undo,
			redo,
			restart,
			getSolutionHint,
			getMoveCount,
			getUndoCount,
			getHintCount,
			incrementHintCount,
			getDifficulty,
			getSettings,
			canUndo,
			canRedo,
		}),
		[
			gameState,
			isLoading,
			currentPieceIndex,
			initializeGame,
			placePiece,
			canPlacePiece,
			setCurrentPieceIndex,
			cyclePiece,
			getNextPieceIndex,
			getPreviousPieceIndex,
			isGameWon,
			isPiecePlaced,
			getAllPiecesPlaced,
			getCurrentPiece,
			getPieceByIndex,
			getPlacedPieces,
			undo,
			redo,
			restart,
			getSolutionHint,
			getMoveCount,
			getUndoCount,
			getHintCount,
			incrementHintCount,
			getDifficulty,
			getSettings,
			canUndo,
			canRedo,
		],
	);

	return <GameStateContext.Provider value={value}>{children}</GameStateContext.Provider>;
}

export function useGameState() {
	const context = useContext(GameStateContext);
	if (!context) {
		throw new Error('useGameState must be used within a GameStateProvider');
	}
	return context;
}
