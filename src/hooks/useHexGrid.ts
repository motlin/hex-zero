import {useMemo} from 'react';
import {useGameState} from '../contexts/GameStateContext';

/**
 * Hook for accessing the hex grid
 */
export function useHexGrid() {
	const {gameState} = useGameState();

	const grid = useMemo(() => {
		if (!gameState) return null;
		return gameState.getGrid();
	}, [gameState]);

	return {
		grid,
		getHexHeight: (q: number, r: number) => {
			if (!grid) return 0;
			const hex = grid.getHex(q, r);
			return hex?.height || 0;
		},
		isValidHex: (q: number, r: number) => {
			if (!grid) return false;
			return grid.getHex(q, r) !== null;
		},
		getAllHexes: () => {
			if (!grid) return [];
			const hexes: unknown[] = [];
			grid.hexes.forEach((hex) => hexes.push(hex));
			return hexes;
		},
	};
}
