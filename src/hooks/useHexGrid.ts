import {useMemo} from 'react';
import {useGameState} from '../contexts/GameStateContext';
import type {HexGrid} from '../state/HexGrid';

/**
 * Hook for accessing the hex grid
 */
export function useHexGrid(): HexGrid | null {
	const {gameState} = useGameState();

	return useMemo(() => {
		if (!gameState) return null;
		return gameState.getGrid();
	}, [gameState]);
}
