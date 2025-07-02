import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { SkiaTest } from './src/components/SkiaTest';
import { DependencyTest } from './src/components/DependencyTest';
import { GameLogicTest } from './src/components/GameLogicTest';
import { GameStateTest } from './src/components/GameStateTest';
import { GameStateProvider } from './src/contexts/GameStateContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { PiecePreviewDemo } from './src/screens/PiecePreviewDemo';
import { HexGridDemo } from './src/screens/HexGridDemo';
import { GameDemo } from './src/screens/GameDemo';
import { DifficultySelectionScreen } from './src/screens/DifficultySelectionScreen';
import { HelpScreen } from './src/screens/HelpScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { SettingsProvider } from './src/contexts/SettingsContext';
import { useState } from 'react';

type AppScreen = 'menu' | 'difficulty' | 'game' | 'help' | 'settings';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('menu');
  const [gameSettings, setGameSettings] = useState({ radius: 3, numPieces: 6 });

  const handleSelectDifficulty = (radius: number, numPieces: number) => {
    setGameSettings({ radius, numPieces });
    setCurrentScreen('game');
  };

  if (currentScreen === 'difficulty') {
    return (
      <DifficultySelectionScreen
        onSelectDifficulty={handleSelectDifficulty}
        onBackToMenu={() => setCurrentScreen('menu')}
      />
    );
  }

  if (currentScreen === 'game') {
    return (
      <GameDemo
        radius={gameSettings.radius}
        numPieces={gameSettings.numPieces}
        onBackToMenu={() => setCurrentScreen('difficulty')}
      />
    );
  }

  if (currentScreen === 'help') {
    return (
      <HelpScreen
        onBack={() => setCurrentScreen('menu')}
      />
    );
  }

  if (currentScreen === 'settings') {
    return (
      <SettingsScreen
        onBack={() => setCurrentScreen('menu')}
      />
    );
  }

  return (
    <ThemeProvider>
      <SettingsProvider>
        <GameStateProvider>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.container}>
            <Text style={styles.header}>Hex Zero</Text>
            <SkiaTest />
            <DependencyTest />
            <GameLogicTest />
            <GameStateTest />
            <View style={styles.demoSection}>
              <Text style={styles.demoHeader}>Interactive Demos</Text>
              <TouchableOpacity
                style={styles.playButton}
                onPress={() => setCurrentScreen('difficulty')}
              >
                <Text style={styles.playButtonText}>🎮 Play Full Game</Text>
              </TouchableOpacity>
              <View style={styles.menuButtons}>
                <TouchableOpacity
                  style={styles.menuButton}
                  onPress={() => setCurrentScreen('help')}
                >
                  <Text style={styles.menuButtonText}>❓ How to Play</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuButton}
                  onPress={() => setCurrentScreen('settings')}
                >
                  <Text style={styles.menuButtonText}>⚙️ Settings</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.separator} />
              <HexGridDemo />
              <View style={styles.separator} />
              <PiecePreviewDemo />
            </View>
            <StatusBar style="auto" />
          </View>
        </ScrollView>
      </GameStateProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  demoSection: {
    width: '100%',
    marginTop: 30,
  },
  demoHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  separator: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 20,
    marginHorizontal: 20,
  },
  playButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  menuButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    paddingHorizontal: 20,
  },
  menuButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    flex: 0.45,
    alignItems: 'center',
  },
  menuButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});
