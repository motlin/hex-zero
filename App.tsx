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
import { useState } from 'react';

export default function App() {
  const [showGame, setShowGame] = useState(false);

  if (showGame) {
    return <GameDemo onBackToMenu={() => setShowGame(false)} />;
  }

  return (
    <ThemeProvider>
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
                onPress={() => setShowGame(true)}
              >
                <Text style={styles.playButtonText}>🎮 Play Full Game</Text>
              </TouchableOpacity>
              <View style={styles.separator} />
              <HexGridDemo />
              <View style={styles.separator} />
              <PiecePreviewDemo />
            </View>
            <StatusBar style="auto" />
          </View>
        </ScrollView>
      </GameStateProvider>
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
});
