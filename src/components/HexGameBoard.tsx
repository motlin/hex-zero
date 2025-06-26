/**
 * Main game board component using Skia renderer
 * Handles touch interactions and game rendering
 */

import React, {useState, useRef, useCallback, useMemo} from 'react';
import {
	View,
	StyleSheet,
	Dimensions,
	PanResponder,
	GestureResponderEvent,
	PanResponderGestureState,
} from 'react-native';
import {Canvas} from '@shopify/react-native-skia';
import {SkiaHexRenderer, SkiaHexRendererCompat} from '../renderer/SkiaHexRenderer';
import type {HexGrid} from '../state/HexGrid';
import type {Piece} from '../state/SeptominoGenerator';
import type {HexPoint} from '../utils/hex-calculations';
import {calculateHexSize} from '../utils/game-dimensions';

interface HexGameBoardProps {
	grid: HexGrid;
	selectedPiece?: Piece | null;
	onHexPress?: (hex: HexPoint) => void;
	onPiecePlaced?: (piece: Piece, position: HexPoint) => void;
	showHints?: boolean;
	hintCells?: HexPoint[];
	theme?: 'light' | 'dark';
}

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

export const HexGameBoard: React.FC<HexGameBoardProps> = ({
	grid,
	selectedPiece,
	onHexPress,
	onPiecePlaced,
	showHints = false,
	hintCells = [],
	theme = 'light',
}) => {
	const [offset, setOffset] = useState({x: screenWidth / 2, y: screenHeight / 2});
	const [scale, setScale] = useState(1);
	const [hoveredHex, setHoveredHex] = useState<HexPoint | null>(null);
	const [invalidPlacementCells, setInvalidPlacementCells] = useState<HexPoint[]>([]);
	const [animatingCells, setAnimatingCells] = useState<
		Array<{q: number; r: number; startHeight: number; endHeight: number}>
	>([]);

	const renderer = useRef<SkiaHexRendererCompat | null>(null);
	const lastTapTime = useRef(0);
	const lastScale = useRef(1);
	const baseDistance = useRef(0);

	// Calculate optimal hex size
	const hexSize = useMemo(() => {
		return calculateHexSize(screenWidth, screenHeight - 200, grid.radius, scale);
	}, [grid.radius, scale]);

	// Initialize renderer
	if (!renderer.current) {
		renderer.current = new SkiaHexRendererCompat(grid, hexSize);
	}

	// Handle touch/mouse position to hex conversion
	const handlePointerPosition = useCallback(
		(x: number, y: number) => {
			if (!renderer.current) return null;
			return renderer.current.pixelToHex(x - offset.x, y - offset.y);
		},
		[offset],
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
					setTimeout(() => {
						setAnimatingCells([]);
					}, 500);
				} else {
					// Show invalid placement feedback
					setInvalidPlacementCells(worldCoords);
					setTimeout(() => {
						setInvalidPlacementCells([]);
					}, 300);
				}
			} else if (onHexPress) {
				onHexPress(hex);
			}
		},
		[selectedPiece, onPiecePlaced, onHexPress, grid],
	);

	// Pan responder for touch handling
	const panResponder = useMemo(
		() =>
			PanResponder.create({
				onStartShouldSetPanResponder: () => true,
				onMoveShouldSetPanResponder: () => true,

				onPanResponderGrant: (evt: GestureResponderEvent) => {
					const now = Date.now();
					const timeDiff = now - lastTapTime.current;

					// Double tap to reset view
					if (timeDiff < 300) {
						setScale(1);
						setOffset({x: screenWidth / 2, y: screenHeight / 2});
					} else {
						// Single tap - check for hex interaction
						const hex = handlePointerPosition(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
						if (hex) {
							handleHexInteraction(hex);
						}
					}

					lastTapTime.current = now;
				},

				onPanResponderMove: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
					// Handle pinch zoom
					if (evt.nativeEvent.touches.length === 2) {
						const touch1 = evt.nativeEvent.touches[0];
						const touch2 = evt.nativeEvent.touches[1];
						const distance = Math.sqrt(
							Math.pow(touch2.pageX - touch1.pageX, 2) + Math.pow(touch2.pageY - touch1.pageY, 2),
						);

						if (baseDistance.current === 0) {
							baseDistance.current = distance;
							lastScale.current = scale;
						} else {
							const newScale = Math.max(
								0.5,
								Math.min(3, lastScale.current * (distance / baseDistance.current)),
							);
							setScale(newScale);
						}
					} else {
						// Handle pan
						setOffset({
							x: offset.x + gestureState.dx,
							y: offset.y + gestureState.dy,
						});

						// Update hovered hex
						const hex = handlePointerPosition(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
						setHoveredHex(hex);
					}
				},

				onPanResponderRelease: () => {
					baseDistance.current = 0;
					setHoveredHex(null);
				},
			}),
		[offset, scale, handlePointerPosition, handleHexInteraction],
	);

	return (
		<View
			style={styles.container}
			{...panResponder.panHandlers}
		>
			<Canvas style={styles.canvas}>
				<SkiaHexRenderer
					grid={grid}
					hexSize={hexSize}
					offsetX={offset.x}
					offsetY={offset.y}
					scale={scale}
					theme={theme}
					showCoordinates={true}
					hoveredHex={hoveredHex}
					selectedPiece={selectedPiece}
					hintCells={showHints ? hintCells : []}
					invalidPlacementCells={invalidPlacementCells}
					animatingCells={animatingCells}
					onAnimationComplete={() => setAnimatingCells([])}
				/>
			</Canvas>
		</View>
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
});
