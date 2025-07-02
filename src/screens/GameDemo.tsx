/**
 * Demo screen to showcase the complete game experience
 * Initializes a game and demonstrates the full game flow
 */

import React, {useEffect} from 'react';
import {View, StyleSheet} from 'react-native';
import {GameScreen} from './GameScreen';
import {GameStateProvider} from '../contexts/GameStateContext';
import {ThemeProvider} from '../context/ThemeContext';
import {useGameState} from '../contexts/GameStateContext';

// Inner component that initializes the game
const GameInitializer: React.FC<{
	radius: number;
	numPieces: number;
	onBackToMenu?: () => void;
}> = ({radius, numPieces, onBackToMenu}) => {
	const {initializeGame} = useGameState();

	useEffect(() => {
		initializeGame(radius, numPieces);
	}, [initializeGame, radius, numPieces]);

	return <GameScreen onBackToMenu={onBackToMenu} />;
};

interface GameDemoProps {
	radius?: number;
	numPieces?: number;
	onBackToMenu?: () => void;
}

export const GameDemo: React.FC<GameDemoProps> = ({radius = 3, numPieces = 6, onBackToMenu}) => {
	return (
		<ThemeProvider>
			<GameStateProvider>
				<View style={styles.container}>
					<GameInitializer
						radius={radius}
						numPieces={numPieces}
						onBackToMenu={onBackToMenu}
					/>
				</View>
			</GameStateProvider>
		</ThemeProvider>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});
