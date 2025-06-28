/**
 * Enhanced game board component with React Native Gesture Handler
 * Implements smooth pan and zoom with proper gesture handling
 */

import React, {useRef, useCallback, useMemo} from 'react';
import {View, StyleSheet, Dimensions, TouchableOpacity, Text} from 'react-native';
import {Canvas} from '@shopify/react-native-skia';
import {Gesture, GestureDetector, GestureHandlerRootView} from 'react-native-gesture-handler';
import {useSharedValue, withSpring, runOnJS, clamp, useAnimatedReaction} from 'react-native-reanimated';
import {SkiaHexRenderer, SkiaHexRendererCompat} from '../renderer/SkiaHexRenderer';
import type {HexGrid} from '../state/HexGrid';
import type {Piece} from '../state/SeptominoGenerator';
import type {HexPoint} from '../utils/hex-calculations';
import {calculateHexSize} from '../utils/game-dimensions';

interface HexGameBoardWithGesturesProps {
	grid: HexGrid;
	selectedPiece?: Piece | null;
	onHexPress?: (hex: HexPoint) => void;
	onPiecePlaced?: (piece: Piece, position: HexPoint) => void;
	onInvalidPlacement?: (piece: Piece) => void;
	showHints?: boolean;
	hintCells?: HexPoint[];
	validPlacementCells?: HexPoint[];
	theme?: 'light' | 'dark';
	draggedPiece?: Piece | null;
	dropPosition?: {x: number; y: number} | null;
	onDropComplete?: () => void;
}

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

// Constants for gesture handling
const MIN_SCALE = 0.5;
const MAX_SCALE = 3.0;
const SPRING_CONFIG = {
	damping: 15,
	stiffness: 150,
};

export const HexGameBoardWithGestures: React.FC<HexGameBoardWithGesturesProps> = ({
	grid,
	selectedPiece,
	onHexPress,
	onPiecePlaced,
	onInvalidPlacement,
	showHints = false,
	hintCells = [],
	validPlacementCells = [],
	theme = 'light',
	draggedPiece,
	dropPosition,
	onDropComplete,
}) => {
	// Shared values for animations
	const scale = useSharedValue(1);
	const savedScale = useSharedValue(1);
	const translateX = useSharedValue(0);
	const translateY = useSharedValue(0);
	const savedTranslateX = useSharedValue(0);
	const savedTranslateY = useSharedValue(0);

	// State for rendering
	const [hoveredHex, setHoveredHex] = React.useState<HexPoint | null>(null);
	const [invalidPlacementCells, setInvalidPlacementCells] = React.useState<HexPoint[]>([]);
	const [animatingCells, setAnimatingCells] = React.useState<
		Array<{
			q: number;
			r: number;
			startHeight: number;
			endHeight: number;
		}>
	>([]);

	// Refs
	const renderer = useRef<SkiaHexRendererCompat | null>(null);
	const boardRef = useRef<View>(null);

	// Calculate optimal hex size based on scale
	const hexSize = useMemo(() => {
		return calculateHexSize(screenWidth, screenHeight - 200, grid.radius, 1);
	}, [grid.radius]);

	// Initialize renderer
	if (!renderer.current) {
		renderer.current = new SkiaHexRendererCompat(grid, hexSize);
	}

	// Handle touch/mouse position to hex conversion with proper hit testing
	const handlePointerPosition = useCallback(
		(x: number, y: number, currentScale: number, offsetX: number, offsetY: number) => {
			if (!renderer.current) return null;

			// Convert screen coordinates to world coordinates
			// The canvas is centered at (screenWidth/2, screenHeight/2) and then translated/scaled
			const worldX = (x - screenWidth / 2) / currentScale - offsetX;
			const worldY = (y - screenHeight / 2) / currentScale - offsetY;

			// Use enhanced hit detection with proper hexagonal boundary testing
			return renderer.current.pixelToHexWithHitTest(worldX, worldY);
		},
		[grid, hexSize],
	);

	// Handle hex selection/piece placement
	const handleHexInteraction = useCallback(
		(hex: HexPoint) => {
			if (selectedPiece && onPiecePlaced) {
				// Check if placement is valid
				const worldCoords = selectedPiece.tiles.map((tile) => ({
					q: hex.q + tile.q - selectedPiece.center.q,
					r: hex.r + tile.r - selectedPiece.center.r,
				}));
				const canPlace = worldCoords.every(
					(coord) => grid.isValidCoordinate(coord.q, coord.r) && grid.getHeight(coord.q, coord.r) > 0,
				);

				if (canPlace) {
					// Animate the placement
					const affectedCells = worldCoords.map((coord) => ({
						q: coord.q,
						r: coord.r,
						startHeight: grid.getHeight(coord.q, coord.r),
						endHeight: grid.getHeight(coord.q, coord.r) - 1,
					}));
					setAnimatingCells(affectedCells);

					// Notify parent
					onPiecePlaced(selectedPiece, hex);

					// Clear animation after completion
					// Allow extra time for staggered animations and particles
					setTimeout(() => {
						setAnimatingCells([]);
					}, 800);
				} else {
					// Show invalid placement feedback
					setInvalidPlacementCells(worldCoords);
					setTimeout(() => {
						setInvalidPlacementCells([]);
					}, 300);

					// Notify about invalid placement for shake animation
					if (onInvalidPlacement) {
						onInvalidPlacement(selectedPiece);
					}
				}
			} else if (onHexPress) {
				onHexPress(hex);
			}
		},
		[selectedPiece, onPiecePlaced, onInvalidPlacement, onHexPress, grid],
	);

	// Reset view to center
	const resetView = useCallback(() => {
		'worklet';
		scale.value = withSpring(1, SPRING_CONFIG);
		translateX.value = withSpring(0, SPRING_CONFIG);
		translateY.value = withSpring(0, SPRING_CONFIG);
	}, [scale, translateX, translateY]);

	// Pan gesture
	const panGesture = Gesture.Pan()
		.onStart(() => {
			savedTranslateX.value = translateX.value;
			savedTranslateY.value = translateY.value;
		})
		.onUpdate((event) => {
			translateX.value = savedTranslateX.value + event.translationX / scale.value;
			translateY.value = savedTranslateY.value + event.translationY / scale.value;

			// Update hovered hex during pan for better user feedback
			runOnJS(() => {
				const hex = handlePointerPosition(event.x, event.y, scale.value, translateX.value, translateY.value);
				setHoveredHex(hex);
			})();
		})
		.onEnd(() => {
			// Clear hover state when pan ends
			runOnJS(setHoveredHex)(null);

			// Optional: Add bounds checking to prevent panning too far
			const maxTranslate = 500 / scale.value;
			translateX.value = withSpring(clamp(translateX.value, -maxTranslate, maxTranslate), SPRING_CONFIG);
			translateY.value = withSpring(clamp(translateY.value, -maxTranslate, maxTranslate), SPRING_CONFIG);
		});

	// Pinch gesture for zoom
	const pinchGesture = Gesture.Pinch()
		.onStart(() => {
			savedScale.value = scale.value;
		})
		.onUpdate((event) => {
			// Calculate new scale with limits
			const newScale = clamp(savedScale.value * event.scale, MIN_SCALE, MAX_SCALE);
			scale.value = newScale;

			// Adjust translation to zoom towards focal point
			if (event.focalX && event.focalY) {
				const scaleDiff = newScale - savedScale.value;
				const focalPointX = (event.focalX - screenWidth / 2) / savedScale.value;
				const focalPointY = (event.focalY - screenHeight / 2) / savedScale.value;

				translateX.value = savedTranslateX.value - (focalPointX * scaleDiff) / savedScale.value;
				translateY.value = savedTranslateY.value - (focalPointY * scaleDiff) / savedScale.value;
			}
		});

	// Tap gesture for hex interaction
	const tapGesture = Gesture.Tap().onEnd((event) => {
		runOnJS(() => {
			const hex = handlePointerPosition(event.x, event.y, scale.value, translateX.value, translateY.value);
			if (hex) {
				handleHexInteraction(hex);
			}
		})();
	});

	// Double tap gesture for reset
	const doubleTapGesture = Gesture.Tap()
		.numberOfTaps(2)
		.onEnd(() => {
			resetView();
		});

	// Long press gesture for hex info or special actions
	const longPressGesture = Gesture.LongPress()
		.minDuration(500)
		.onStart((event) => {
			runOnJS(() => {
				const hex = handlePointerPosition(event.x, event.y, scale.value, translateX.value, translateY.value);
				if (hex) {
					// Update hovered hex for visual feedback
					setHoveredHex(hex);
				}
			})();
		})
		.onEnd(() => {
			runOnJS(setHoveredHex)(null);
		});

	// Combine gestures
	const composedGesture = Gesture.Race(
		doubleTapGesture,
		longPressGesture,
		Gesture.Simultaneous(tapGesture, panGesture, pinchGesture),
	);

	// State to track animated values for rendering
	const [renderTransform, setRenderTransform] = React.useState({
		offsetX: 0,
		offsetY: 0,
		scale: 1,
	});

	// Update render transform when animated values change
	useAnimatedReaction(
		() => ({
			x: translateX.value,
			y: translateY.value,
			s: scale.value,
		}),
		(current) => {
			runOnJS(setRenderTransform)({
				offsetX: current.x,
				offsetY: current.y,
				scale: current.s,
			});
		},
		[],
	);

	// Handle drop from external drag
	React.useEffect(() => {
		if (draggedPiece && dropPosition && boardRef.current) {
			// Convert screen coordinates to board-relative coordinates
			boardRef.current.measure((_x, _y, _width, _height, pageX, pageY) => {
				// Calculate the drop position relative to the board
				const boardX = dropPosition.x - pageX;
				const boardY = dropPosition.y - pageY;

				// Convert to hex coordinates using current transform
				const hex = handlePointerPosition(
					boardX,
					boardY,
					renderTransform.scale,
					renderTransform.offsetX,
					renderTransform.offsetY,
				);

				if (hex && onPiecePlaced) {
					// Try to place the piece
					const worldCoords = draggedPiece.tiles.map((tile) => ({
						q: hex.q + tile.q - draggedPiece.center.q,
						r: hex.r + tile.r - draggedPiece.center.r,
					}));

					const canPlace = worldCoords.every(
						(coord) => grid.isValidCoordinate(coord.q, coord.r) && grid.getHeight(coord.q, coord.r) > 0,
					);

					if (canPlace) {
						// Animate the placement
						const affectedCells = worldCoords.map((coord) => ({
							q: coord.q,
							r: coord.r,
							startHeight: grid.getHeight(coord.q, coord.r),
							endHeight: grid.getHeight(coord.q, coord.r) - 1,
						}));
						setAnimatingCells(affectedCells);

						// Notify parent about successful placement
						onPiecePlaced(draggedPiece, hex);

						// Clear animation after completion
						setTimeout(() => {
							setAnimatingCells([]);
						}, 800);
					} else {
						// Show invalid placement feedback
						setInvalidPlacementCells(worldCoords);
						setTimeout(() => {
							setInvalidPlacementCells([]);
						}, 300);

						// Notify about invalid placement for shake animation
						if (onInvalidPlacement) {
							onInvalidPlacement(draggedPiece);
						}
					}
				}

				// Notify that drop handling is complete
				if (onDropComplete) {
					onDropComplete();
				}
			});
		}
	}, [
		draggedPiece,
		dropPosition,
		grid,
		onPiecePlaced,
		onInvalidPlacement,
		onDropComplete,
		handlePointerPosition,
		renderTransform,
	]);

	// Check if view is centered
	const isViewCentered =
		Math.abs(renderTransform.offsetX) < 5 &&
		Math.abs(renderTransform.offsetY) < 5 &&
		Math.abs(renderTransform.scale - 1) < 0.05;

	return (
		<GestureHandlerRootView style={styles.container}>
			<GestureDetector gesture={composedGesture}>
				<View
					ref={boardRef}
					style={styles.container}
				>
					<Canvas style={styles.canvas}>
						<SkiaHexRenderer
							grid={grid}
							hexSize={hexSize}
							offsetX={renderTransform.offsetX}
							offsetY={renderTransform.offsetY}
							scale={renderTransform.scale}
							theme={theme}
							hoveredHex={hoveredHex}
							selectedPiece={selectedPiece}
							hintCells={showHints ? hintCells : []}
							validPlacementCells={validPlacementCells}
							invalidPlacementCells={invalidPlacementCells}
							animatingCells={animatingCells}
							onAnimationComplete={() => setAnimatingCells([])}
						/>
					</Canvas>
					{!isViewCentered && (
						<TouchableOpacity
							style={[
								styles.resetButton,
								theme === 'dark' ? styles.resetButtonDark : styles.resetButtonLight,
							]}
							onPress={() => runOnJS(resetView)()}
						>
							<Text
								style={[
									styles.resetButtonText,
									theme === 'dark' ? styles.resetButtonTextDark : styles.resetButtonTextLight,
								]}
							>
								⟲ Reset View
							</Text>
						</TouchableOpacity>
					)}
				</View>
			</GestureDetector>
		</GestureHandlerRootView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#1a1a1a',
	},
	canvas: {
		flex: 1,
	},
	resetButton: {
		position: 'absolute',
		top: 10,
		right: 10,
		paddingHorizontal: 15,
		paddingVertical: 8,
		borderRadius: 20,
		shadowColor: '#000',
		shadowOffset: {width: 0, height: 2},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
	},
	resetButtonDark: {
		backgroundColor: '#333',
		borderWidth: 1,
		borderColor: '#555',
	},
	resetButtonLight: {
		backgroundColor: '#fff',
		borderWidth: 1,
		borderColor: '#ddd',
	},
	resetButtonText: {
		fontSize: 14,
		fontWeight: '600',
	},
	resetButtonTextDark: {
		color: '#fff',
	},
	resetButtonTextLight: {
		color: '#333',
	},
});
