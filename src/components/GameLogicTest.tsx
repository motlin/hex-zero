import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {HexGrid} from '../state/HexGrid';
import {SeptominoGenerator} from '../state/SeptominoGenerator';
import {GameState} from '../state/GameState';

export function GameLogicTest() {
	const testResults: string[] = [];

	try {
		const hexGrid = new HexGrid(2);
		testResults.push('✅ HexGrid instantiation successful');
		testResults.push(`  - Radius: ${hexGrid.radius}`);
		testResults.push(`  - Size: ${hexGrid.hexes.size} cells`);
	} catch (error) {
		testResults.push(`❌ HexGrid error: ${error}`);
	}

	try {
		const piece = SeptominoGenerator.generatePiece();
		testResults.push('✅ SeptominoGenerator instantiation successful');
		testResults.push(`  - Generated piece size: ${piece.tiles.length} tiles`);
	} catch (error) {
		testResults.push(`❌ SeptominoGenerator error: ${error}`);
	}

	try {
		const gameState = new GameState(3, 5);
		testResults.push('✅ GameState instantiation successful');
		testResults.push(`  - Grid radius: ${gameState.getGrid().radius}`);
		testResults.push(`  - Number of pieces: ${gameState.getPieces().length}`);
	} catch (error) {
		testResults.push(`❌ GameState error: ${error}`);
	}

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Game Logic Test Results</Text>
			{testResults.map((result, index) => (
				<Text
					key={index}
					style={styles.result}
				>
					{result}
				</Text>
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
		backgroundColor: '#f0f0f0',
	},
	title: {
		fontSize: 20,
		fontWeight: 'bold',
		marginBottom: 10,
	},
	result: {
		fontSize: 14,
		marginVertical: 2,
		fontFamily: 'monospace',
	},
});
