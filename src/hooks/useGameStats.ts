import {useGameState} from '../contexts/GameStateContext';

/**
 * Hook for accessing game statistics
 */
export function useGameStats() {
	const {gameState, getMoveCount, getHintCount, getPlacedPieces} = useGameState();

	const placedPiecesSet = getPlacedPieces();
	const piecesPlaced = placedPiecesSet.size;
	const totalPieces = gameState ? gameState.getPieces().length : 0;
	const remainingPieces = totalPieces - piecesPlaced;
	const completionPercentage = totalPieces > 0 ? Math.round((piecesPlaced / totalPieces) * 100) : 0;

	return {
		moveCount: getMoveCount(),
		hintsUsed: getHintCount(),
		piecesPlaced,
		totalPieces,
		remainingPieces,
		completionPercentage,
	};
}
