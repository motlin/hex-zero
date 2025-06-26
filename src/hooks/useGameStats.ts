import {useGameState} from '../contexts/GameStateContext';

/**
 * Hook for accessing game statistics
 */
export function useGameStats() {
	const {getMoveCount, getUndoCount, getHintCount} = useGameState();

	return {
		getMoveCount,
		getUndoCount,
		getHintCount,
	};
}
