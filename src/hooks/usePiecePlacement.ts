import {useGameState} from '../contexts/GameStateContext';

/**
 * Hook for piece placement operations
 */
export function usePiecePlacement() {
	const {placePiece, canPlacePiece} = useGameState();

	return {
		placePiece,
		canPlacePiece,
	};
}
