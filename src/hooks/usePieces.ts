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
		selectedPieceIndex: currentPieceIndex,
		selectedPiece: getCurrentPiece(),
		selectPiece: setCurrentPieceIndex,
		cycleSelectedPiece: cyclePiece,
		navigatePiece: (direction: 'next' | 'previous') => {
			const nextIndex = direction === 'next' ? getNextPieceIndex() : getPreviousPieceIndex();
			if (nextIndex !== null) {
				setCurrentPieceIndex(nextIndex);
			}
		},
		getPieceByIndex,
		isPiecePlaced,
		getAllPiecesPlaced,
		getPlacedPieces,
	};
}
