import {useGameState} from '../contexts/GameStateContext';

/**
 * Hook for basic game operations and state
 */
export function useGame() {
	const {gameState, isLoading, initializeGame, restart, isGameWon, getDifficulty, getSettings} = useGameState();

	return {
		gameState,
		isLoading,
		initializeGame,
		restart,
		isGameWon,
		getDifficulty,
		getSettings,
	};
}
