/**
 * Draggable piece component using React Native Gesture Handler
 * Provides drag and drop functionality for game pieces
 */

import React, {useRef, useCallback, useImperativeHandle, forwardRef} from 'react';
import {StyleSheet, Animated, View} from 'react-native';
import {
	PanGestureHandler,
	State,
	type PanGestureHandlerStateChangeEvent,
	type PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
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
		const translateX = useRef(new Animated.Value(0)).current;
		const translateY = useRef(new Animated.Value(0)).current;
		const opacity = useRef(new Animated.Value(1)).current;
		const scale = useRef(new Animated.Value(1)).current;
		const shakeX = useRef(new Animated.Value(0)).current;
		const startPosition = useRef({x: 0, y: 0});

		const triggerShakeAnimation = useCallback(() => {
			const shakeDistance = 10;
			const shakeSequence = Animated.sequence([
				Animated.timing(shakeX, {
					toValue: shakeDistance,
					duration: 50,
					useNativeDriver: true,
				}),
				Animated.timing(shakeX, {
					toValue: -shakeDistance,
					duration: 50,
					useNativeDriver: true,
				}),
				Animated.timing(shakeX, {
					toValue: shakeDistance,
					duration: 50,
					useNativeDriver: true,
				}),
				Animated.timing(shakeX, {
					toValue: 0,
					duration: 50,
					useNativeDriver: true,
				}),
			]);

			if (settings.hapticEnabled) {
				Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
			}

			shakeSequence.start(() => {
				if (onInvalidPlacement) {
					onInvalidPlacement(piece);
				}
			});
		}, [shakeX, onInvalidPlacement, piece, settings.hapticEnabled]);

		useImperativeHandle(
			ref,
			() => ({
				triggerShakeAnimation,
			}),
			[triggerShakeAnimation],
		);

		const handleGestureEvent = useCallback(
			(event: PanGestureHandlerGestureEvent) => {
				if (disabled || isPlaced) return;

				const {translationX, translationY, absoluteX, absoluteY} = event.nativeEvent;
				translateX.setValue(translationX);
				translateY.setValue(translationY);

				if (onDragMove) {
					onDragMove(piece, absoluteX, absoluteY);
				}
			},
			[disabled, isPlaced, piece, translateX, translateY, onDragMove],
		);

		const handleStateChange = useCallback(
			(event: PanGestureHandlerStateChangeEvent) => {
				if (disabled || isPlaced) return;

				const {state, absoluteX, absoluteY} = event.nativeEvent;

				if (state === State.BEGAN) {
					startPosition.current = {x: absoluteX, y: absoluteY};

					if (settings.hapticEnabled) {
						Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
					}

					Animated.parallel([
						Animated.spring(scale, {
							toValue: 1.2,
							useNativeDriver: true,
						}),
						Animated.timing(opacity, {
							toValue: 0.8,
							duration: 200,
							useNativeDriver: true,
						}),
					]).start();

					if (onDragStart) {
						onDragStart(piece, index);
					}
				} else if (state === State.END || state === State.CANCELLED || state === State.FAILED) {
					Animated.parallel([
						Animated.spring(translateX, {
							toValue: 0,
							useNativeDriver: true,
						}),
						Animated.spring(translateY, {
							toValue: 0,
							useNativeDriver: true,
						}),
						Animated.spring(scale, {
							toValue: 1,
							useNativeDriver: true,
						}),
						Animated.timing(opacity, {
							toValue: 1,
							duration: 200,
							useNativeDriver: true,
						}),
					]).start();

					if (state === State.END && onDragEnd) {
						onDragEnd(piece, absoluteX, absoluteY);
					}
				}
			},
			[
				disabled,
				isPlaced,
				piece,
				index,
				translateX,
				translateY,
				scale,
				opacity,
				onDragStart,
				onDragEnd,
				settings.hapticEnabled,
			],
		);

		const pieceSize = hexSize * 3;
		const renderOpacity = isPlaced ? 0.3 : 1;

		return (
			<PanGestureHandler
				onGestureEvent={handleGestureEvent}
				onHandlerStateChange={handleStateChange}
				enabled={!disabled && !isPlaced}
			>
				<Animated.View
					testID={testID}
					style={[
						styles.container,
						{
							opacity: Animated.multiply(opacity, renderOpacity),
							transform: [{translateX: Animated.add(translateX, shakeX)}, {translateY}, {scale}],
						},
					]}
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
			</PanGestureHandler>
		);
	},
);

const styles = StyleSheet.create({
	container: {
		justifyContent: 'center',
		alignItems: 'center',
	},
	pieceContainer: {
		backgroundColor: 'transparent',
	},
});
