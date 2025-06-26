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
const GameInitializer: React.FC<{onBackToMenu?: () => void}> = ({onBackToMenu}) => {
	const {initializeGame} = useGameState();

	useEffect(() => {
		// Initialize a medium difficulty game
		// radius 4 = medium, 7 pieces
		initializeGame(4, 7);
	}, [initializeGame]);

	return <GameScreen onBackToMenu={onBackToMenu} />;
};

interface GameDemoProps {
	onBackToMenu?: () => void;
}

export const GameDemo: React.FC<GameDemoProps> = ({onBackToMenu}) => {
	return (
		<ThemeProvider>
			<GameStateProvider>
				<View style={styles.container}>
					<GameInitializer onBackToMenu={onBackToMenu} />
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
