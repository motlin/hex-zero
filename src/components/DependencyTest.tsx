import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, Button} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {GestureHandlerRootView, TapGestureHandler} from 'react-native-gesture-handler';
import Animated, {useSharedValue, useAnimatedStyle, withSpring} from 'react-native-reanimated';
import ConfettiCannon from 'react-native-confetti-cannon';

export const DependencyTest: React.FC = () => {
	const [storageValue, setStorageValue] = useState<string | null>(null);
	const [showConfetti, setShowConfetti] = useState(false);
	const scale = useSharedValue(1);

	useEffect(() => {
		const testStorage = async () => {
			try {
				await AsyncStorage.setItem('test_key', 'AsyncStorage is working!');
				const value = await AsyncStorage.getItem('test_key');
				setStorageValue(value);
			} catch (e) {
				console.error('AsyncStorage error:', e);
			}
		};
		testStorage();
	}, []);

	const animatedStyle = useAnimatedStyle(() => {
		return {
			transform: [{scale: scale.value}],
		};
	});

	const handleTap = () => {
		scale.value = withSpring(scale.value === 1 ? 1.5 : 1);
	};

	return (
		<GestureHandlerRootView style={styles.container}>
			<Text style={styles.title}>Dependency Test</Text>

			<Text style={styles.section}>AsyncStorage:</Text>
			<Text>{storageValue || 'Loading...'}</Text>

			<Text style={styles.section}>Gesture Handler + Reanimated:</Text>
			<TapGestureHandler onActivated={handleTap}>
				<Animated.View style={[styles.box, animatedStyle]}>
					<Text style={styles.boxText}>Tap me!</Text>
				</Animated.View>
			</TapGestureHandler>

			<Text style={styles.section}>Confetti:</Text>
			<Button
				title="Show Confetti"
				onPress={() => setShowConfetti(true)}
			/>

			{showConfetti && (
				<ConfettiCannon
					count={200}
					origin={{x: -10, y: 0}}
					autoStart={true}
					fadeOut={true}
					onAnimationEnd={() => setShowConfetti(false)}
				/>
			)}
		</GestureHandlerRootView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
		alignItems: 'center',
		justifyContent: 'center',
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 20,
	},
	section: {
		fontSize: 18,
		fontWeight: '600',
		marginTop: 20,
		marginBottom: 10,
	},
	box: {
		width: 100,
		height: 100,
		backgroundColor: '#06B6D4',
		borderRadius: 10,
		alignItems: 'center',
		justifyContent: 'center',
	},
	boxText: {
		color: 'white',
		fontWeight: 'bold',
	},
});
