import {useGameState} from '../contexts/GameStateContext';

/**
 * Hook for game actions like undo, redo, and hints
 */
export function useGameActions() {
	const {undo, redo, canUndo, canRedo, getSolutionHint, incrementHintCount} = useGameState();

	return {
		undo,
		redo,
		canUndo,
		canRedo,
		getHint: () => {
			const hint = getSolutionHint();
			if (hint) {
				incrementHintCount();
			}
			return hint;
		},
	};
}
