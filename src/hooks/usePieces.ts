import {useGameState} from '../contexts/GameStateContext';

/**
 * Hook for piece-related operations
 */
export function usePieces() {
	const {
		currentPieceIndex,
		setCurrentPieceIndex,
		cyclePiece,
		getNextPieceIndex,
		getPreviousPieceIndex,
		getCurrentPiece,
		getPieceByIndex,
		isPiecePlaced,
		getAllPiecesPlaced,
		getPlacedPieces,
	} = useGameState();

	return {
		currentPieceIndex,
		setCurrentPieceIndex,
		cyclePiece,
		getNextPieceIndex,
		getPreviousPieceIndex,
		getCurrentPiece,
		getPieceByIndex,
		isPiecePlaced,
		getAllPiecesPlaced,
		getPlacedPieces,
	};
}
