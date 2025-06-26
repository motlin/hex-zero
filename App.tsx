import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { SkiaTest } from './src/components/SkiaTest';
import { DependencyTest } from './src/components/DependencyTest';
import { GameLogicTest } from './src/components/GameLogicTest';
import { GameStateTest } from './src/components/GameStateTest';
import { GameStateProvider } from './src/contexts/GameStateContext';

export default function App() {
  return (
    <GameStateProvider>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Text style={styles.header}>Hex Zero</Text>
          <SkiaTest />
          <DependencyTest />
          <GameLogicTest />
          <GameStateTest />
          <StatusBar style="auto" />
        </View>
      </ScrollView>
    </GameStateProvider>
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
});
