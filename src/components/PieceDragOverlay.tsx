/**
 * Overlay component that shows piece preview during drag operations
 * Follows the user's finger/cursor and provides visual feedback
 */

import React, {useEffect, useRef} from 'react';
import {View, StyleSheet, Animated, Dimensions} from 'react-native';
import type {Piece} from '../state/SeptominoGenerator';
import {PiecePreview} from './PiecePreview';
import {useThemeContext} from '../context/ThemeContext';

interface PieceDragOverlayProps {
	piece: Piece | null;
	position: {x: number; y: number};
	isValid: boolean;
	visible: boolean;
	hexSize?: number;
}

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

export const PieceDragOverlay: React.FC<PieceDragOverlayProps> = ({
	piece,
	position,
	isValid,
	visible,
	hexSize = 30,
}) => {
	const {theme} = useThemeContext();
	const opacity = useRef(new Animated.Value(0)).current;
	const scale = useRef(new Animated.Value(0.8)).current;

	useEffect(() => {
		if (visible && piece) {
			Animated.parallel([
				Animated.timing(opacity, {
					toValue: 0.9,
					duration: 200,
					useNativeDriver: true,
				}),
				Animated.spring(scale, {
					toValue: 1.2,
					useNativeDriver: true,
				}),
			]).start();
		} else {
			Animated.parallel([
				Animated.timing(opacity, {
					toValue: 0,
					duration: 150,
					useNativeDriver: true,
				}),
				Animated.timing(scale, {
					toValue: 0.8,
					duration: 150,
					useNativeDriver: true,
				}),
			]).start();
		}
	}, [visible, piece, opacity, scale]);

	if (!piece) return null;

	const pieceSize = hexSize * 4;
	const offsetX = position.x - pieceSize / 2;
	// Offset above finger
	const offsetY = position.y - pieceSize / 2 - 50;

	// Keep piece within screen bounds
	const clampedX = Math.max(0, Math.min(offsetX, screenWidth - pieceSize));
	const clampedY = Math.max(0, Math.min(offsetY, screenHeight - pieceSize));

	return (
		<Animated.View
			style={[
				styles.container,
				{
					opacity,
					transform: [{translateX: clampedX}, {translateY: clampedY}, {scale}],
				},
			]}
			pointerEvents="none"
		>
			<View style={[styles.preview, {width: pieceSize, height: pieceSize}]}>
				<PiecePreview
					piece={piece}
					hexSize={hexSize}
					width={pieceSize}
					height={pieceSize}
					isInvalid={!isValid}
					opacity={0.9}
					strokeWidth={2}
					showGhost={isValid}
				/>
			</View>
			{!isValid && (
				<View style={[styles.invalidIndicator, {backgroundColor: theme.colors.invalidFill}]}>
					<View style={styles.invalidX}>
						<View style={[styles.invalidLine, styles.invalidLine1]} />
						<View style={[styles.invalidLine, styles.invalidLine2]} />
					</View>
				</View>
			)}
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		zIndex: 1000,
	},
	preview: {
		shadowColor: '#000',
		shadowOffset: {width: 0, height: 4},
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 8,
	},
	invalidIndicator: {
		position: 'absolute',
		top: '50%',
		left: '50%',
		width: 40,
		height: 40,
		borderRadius: 20,
		marginTop: -20,
		marginLeft: -20,
		justifyContent: 'center',
		alignItems: 'center',
	},
	invalidX: {
		width: 20,
		height: 20,
		position: 'relative',
	},
	invalidLine: {
		position: 'absolute',
		width: 28,
		height: 3,
		backgroundColor: 'white',
		top: 8.5,
		left: -4,
	},
	invalidLine1: {
		transform: [{rotate: '45deg'}],
	},
	invalidLine2: {
		transform: [{rotate: '-45deg'}],
	},
});
