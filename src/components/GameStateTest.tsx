import React, {useEffect} from 'react';
import {View, Text, Button, StyleSheet} from 'react-native';
import {useGame, usePieces, useGameActions, useGameStats} from '../hooks';

export function GameStateTest() {
	const {gameState, isLoading, initializeGame, restart, isGameWon, getDifficulty} = useGame();
	const {currentPieceIndex, cyclePiece, getCurrentPiece, getAllPiecesPlaced} = usePieces();
	const {undo, redo, canUndo, canRedo} = useGameActions();
	const {getMoveCount, getUndoCount, getHintCount} = useGameStats();

	useEffect(() => {
		if (!gameState) {
			// Easy difficulty
			initializeGame(3, 4);
		}
	}, [gameState, initializeGame]);

	const currentPiece = getCurrentPiece();

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Game State Context Test</Text>

			{isLoading ? (
				<Text>Loading...</Text>
			) : gameState ? (
				<>
					<View style={styles.infoSection}>
						<Text style={styles.label}>Difficulty: {getDifficulty()}</Text>
						<Text style={styles.label}>Current Piece: {currentPieceIndex}</Text>
						<Text style={styles.label}>Piece Tiles: {currentPiece?.tiles.length || 0}</Text>
						<Text style={styles.label}>All Placed: {getAllPiecesPlaced() ? 'Yes' : 'No'}</Text>
						<Text style={styles.label}>Game Won: {isGameWon() ? 'Yes' : 'No'}</Text>
					</View>

					<View style={styles.statsSection}>
						<Text style={styles.sectionTitle}>Statistics</Text>
						<Text style={styles.label}>Moves: {getMoveCount()}</Text>
						<Text style={styles.label}>Undos: {getUndoCount()}</Text>
						<Text style={styles.label}>Hints: {getHintCount()}</Text>
					</View>

					<View style={styles.buttonRow}>
						<Button
							title="Prev Piece"
							onPress={() => cyclePiece(-1)}
							disabled={getAllPiecesPlaced()}
						/>
						<Button
							title="Next Piece"
							onPress={() => cyclePiece(1)}
							disabled={getAllPiecesPlaced()}
						/>
					</View>

					<View style={styles.buttonRow}>
						<Button
							title="Undo"
							onPress={() => undo()}
							disabled={!canUndo()}
						/>
						<Button
							title="Redo"
							onPress={() => redo()}
							disabled={!canRedo()}
						/>
					</View>

					<View style={styles.buttonRow}>
						<Button
							title="Restart"
							onPress={() => restart()}
						/>
						<Button
							title="New Game"
							onPress={() => initializeGame(3, 6)}
						/>
					</View>

					<Text style={[styles.status, {color: isGameWon() ? 'green' : 'black'}]}>
						{isGameWon() ? '✓ Context and hooks working correctly!' : 'Game in progress...'}
					</Text>
				</>
			) : (
				<Text>No game initialized</Text>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: '#f5f5f5',
		padding: 20,
		borderRadius: 10,
		marginVertical: 10,
		width: '90%',
	},
	title: {
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 15,
		textAlign: 'center',
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: 'bold',
		marginBottom: 5,
	},
	infoSection: {
		marginBottom: 15,
	},
	statsSection: {
		marginBottom: 15,
	},
	label: {
		fontSize: 14,
		marginVertical: 2,
	},
	buttonRow: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		marginVertical: 5,
	},
	status: {
		fontSize: 16,
		fontWeight: 'bold',
		marginTop: 15,
		textAlign: 'center',
	},
});
