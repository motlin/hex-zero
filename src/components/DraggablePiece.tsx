/**
 * Draggable piece component using React Native Gesture Handler
 * Provides drag and drop functionality for game pieces
 * Optimized for minimal touch latency
 */

import React, {useCallback, useImperativeHandle, forwardRef} from 'react';
import {StyleSheet, View} from 'react-native';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withSpring,
	withTiming,
	withSequence,
	runOnJS,
} from 'react-native-reanimated';
import type {Piece} from '../state/SeptominoGenerator';
import {PiecePreview} from './PiecePreview';
import {useThemeContext} from '../context/ThemeContext';
import * as Haptics from 'expo-haptics';
import {useSettings} from '../contexts/SettingsContext';

export interface DraggablePieceRef {
	triggerShakeAnimation: () => void;
}

interface DraggablePieceProps {
	piece: Piece;
	index: number;
	hexSize: number;
	onDragStart?: (piece: Piece, index: number) => void;
	onDragMove?: (piece: Piece, x: number, y: number) => void;
	onDragEnd?: (piece: Piece, x: number, y: number) => void;
	onInvalidPlacement?: (piece: Piece) => void;
	isPlaced?: boolean;
	disabled?: boolean;
	testID?: string;
}

export const DraggablePiece = forwardRef<DraggablePieceRef, DraggablePieceProps>(
	(
		{
			piece,
			index,
			hexSize,
			onDragStart,
			onDragMove,
			onDragEnd,
			onInvalidPlacement,
			isPlaced = false,
			disabled = false,
			testID,
		},
		ref,
	) => {
		const {theme} = useThemeContext();
		const {settings} = useSettings();

		// Shared values for animations
		const translateX = useSharedValue(0);
		const translateY = useSharedValue(0);
		const scale = useSharedValue(1);
		const opacity = useSharedValue(1);
		const shakeX = useSharedValue(0);
		const isDragging = useSharedValue(false);

		const triggerShakeAnimation = useCallback(() => {
			'worklet';
			const shakeDistance = 10;

			// Run shake animation on UI thread
			shakeX.value = withSequence(
				withTiming(shakeDistance, {duration: 50}),
				withTiming(-shakeDistance, {duration: 50}),
				withTiming(shakeDistance, {duration: 50}),
				withTiming(0, {duration: 50}),
			);

			// Haptic feedback for invalid placement
			if (settings.hapticEnabled) {
				runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Error);
			}

			if (onInvalidPlacement) {
				runOnJS(onInvalidPlacement)(piece);
			}
		}, [shakeX, onInvalidPlacement, piece, settings.hapticEnabled]);

		useImperativeHandle(
			ref,
			() => ({
				triggerShakeAnimation,
			}),
			[triggerShakeAnimation],
		);

		// Optimized pan gesture with immediate feedback
		const panGesture = Gesture.Pan()
			.enabled(!disabled && !isPlaced)
			.shouldCancelWhenOutside(false)
			// Immediate response
			.minDistance(0)
			.onStart((_event) => {
				'worklet';
				isDragging.value = true;

				// Immediate visual feedback
				scale.value = withSpring(1.2, {damping: 15, stiffness: 300});
				opacity.value = withTiming(0.8, {duration: 150});

				// Haptic feedback
				if (settings.hapticEnabled) {
					runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
				}

				if (onDragStart) {
					runOnJS(onDragStart)(piece, index);
				}
			})
			.onUpdate((event) => {
				'worklet';
				translateX.value = event.translationX;
				translateY.value = event.translationY;

				// Throttled drag move callback
				if (onDragMove && event.translationX % 2 === 0) {
					runOnJS(onDragMove)(piece, event.absoluteX, event.absoluteY);
				}
			})
			.onEnd((event) => {
				'worklet';
				isDragging.value = false;

				// Animate back to original position
				translateX.value = withSpring(0, {damping: 15, stiffness: 300});
				translateY.value = withSpring(0, {damping: 15, stiffness: 300});
				scale.value = withSpring(1, {damping: 15, stiffness: 300});
				opacity.value = withTiming(1, {duration: 150});

				if (onDragEnd) {
					runOnJS(onDragEnd)(piece, event.absoluteX, event.absoluteY);
				}
			})
			.onFinalize(() => {
				'worklet';
				if (isDragging.value) {
					isDragging.value = false;
					translateX.value = withSpring(0);
					translateY.value = withSpring(0);
					scale.value = withSpring(1);
					opacity.value = withTiming(1);
				}
			});

		const pieceSize = hexSize * 3;

		// Animated styles for better performance
		const animatedStyle = useAnimatedStyle(() => {
			const baseOpacity = isPlaced ? 0.3 : 1;
			return {
				opacity: opacity.value * baseOpacity,
				transform: [
					{translateX: translateX.value + shakeX.value},
					{translateY: translateY.value},
					{scale: scale.value},
				],
			};
		});

		return (
			<GestureDetector gesture={panGesture}>
				<Animated.View
					testID={testID}
					style={[styles.container, animatedStyle]}
				>
					<View
						style={styles.pieceContainer}
						pointerEvents="none"
					>
						<PiecePreview
							piece={piece}
							hexSize={hexSize * 0.7}
							width={pieceSize}
							height={pieceSize}
							color={theme.colors.previewFill}
							opacity={0.9}
							strokeColor={theme.colors.gridLines}
							strokeWidth={1.5}
						/>
					</View>
				</Animated.View>
			</GestureDetector>
		);
	},
);

DraggablePiece.displayName = 'DraggablePiece';

const styles = StyleSheet.create({
	container: {
		justifyContent: 'center',
		alignItems: 'center',
	},
	pieceContainer: {
		backgroundColor: 'transparent',
	},
});
