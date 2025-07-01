/**
 * Skia-based hex renderer for React Native
 * Replaces HTML canvas-based HexRenderer
 */

import React, {useMemo, useEffect, useState} from 'react';
import {Path, Text, Group, DashPathEffect, matchFont} from '@shopify/react-native-skia';
import {PixelRatio, Platform} from 'react-native';
import type {HexGrid} from '../state/HexGrid';
import type {Piece} from '../state/SeptominoGenerator';
import {hexToPixel, pixelToHex, isPointInHex, type Point, type HexPoint} from '../utils/hex-calculations';
import {createHexPath, calculateTextSize} from '../utils/skia-drawing';
import {getTheme, getHeightColorFromTheme, withAlpha, getContrastColor, type ThemeType} from '../ui/SkiaColorTheme';
import type {SkPath, SkFont} from '@shopify/react-native-skia';
import {AnimatedHexCell, createStaggeredAnimation} from '../components/AnimatedHexCell';

interface SkiaHexRendererProps {
	grid: HexGrid;
	hexSize: number;
	offsetX?: number;
	offsetY?: number;
	scale?: number;
	theme?: ThemeType;
	hoveredHex?: HexPoint | null;
	selectedPiece?: Piece | null;
	hintCells?: HexPoint[];
	validPlacementCells?: HexPoint[];
	invalidPlacementCells?: HexPoint[];
	animatingCells?: Array<{q: number; r: number; startHeight: number; endHeight: number}>;
	onAnimationComplete?: () => void;
}

// Deprecated: Use SkiaTheme instead

// Helper component for delayed animation start
const DelayedAnimatedHexCell = ({
	delay,
	path,
	center,
	height,
	animatingCell,
	actualHexSize,
	skiaTheme,
	gridLineColor,
	font,
	fontSize,
	onAnimationComplete,
}: {
	delay: number;
	path: SkPath;
	center: Point;
	height: number;
	animatingCell: {startHeight: number; endHeight: number};
	actualHexSize: number;
	skiaTheme: ReturnType<typeof getTheme>;
	gridLineColor: string;
	font: SkFont | null;
	fontSize: number;
	onAnimationComplete: () => void;
}) => {
	const [shouldAnimate, setShouldAnimate] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => {
			setShouldAnimate(true);
		}, delay);

		return () => clearTimeout(timer);
	}, [delay]);

	if (!shouldAnimate) {
		// Render static hex until animation starts
		return (
			<Group>
				<Path
					path={path}
					color={getHeightColorFromTheme(height, skiaTheme)}
					style="fill"
				/>
				<Path
					path={path}
					color={gridLineColor}
					style="stroke"
					strokeWidth={2}
				/>
				{font && height > 0 && (
					<Text
						x={center.x}
						y={center.y + fontSize / 3}
						text={height.toString()}
						font={font}
						color={getContrastColor(getHeightColorFromTheme(height, skiaTheme))}
						opacity={0.9}
					/>
				)}
			</Group>
		);
	}

	return (
		<AnimatedHexCell
			path={path}
			centerX={center.x}
			centerY={center.y}
			hexSize={actualHexSize}
			startHeight={animatingCell.startHeight}
			endHeight={animatingCell.endHeight}
			theme={skiaTheme}
			gridLineColor={gridLineColor}
			font={font}
			fontSize={fontSize}
			animationDuration={400}
			onAnimationComplete={onAnimationComplete}
		/>
	);
};

export const SkiaHexRenderer: React.FC<SkiaHexRendererProps> = ({
	grid,
	hexSize,
	offsetX = 0,
	offsetY = 0,
	scale = 1,
	theme = 'dark',
	hoveredHex,
	selectedPiece,
	hintCells = [],
	validPlacementCells = [],
	invalidPlacementCells = [],
	animatingCells = [],
	onAnimationComplete,
}) => {
	// Get theme configuration
	const skiaTheme = useMemo(() => getTheme(theme), [theme]);
	// Load system font
	const fontSize = useMemo(() => calculateTextSize(hexSize * scale), [hexSize, scale]);
	const fontFamily = Platform.select({
		ios: 'Helvetica',
		android: 'Roboto',
		default: 'Arial',
	});
	const fontStyle = {
		fontFamily,
		fontSize,
		fontWeight: 'bold' as const,
	};
	const font = useMemo(() => matchFont(fontStyle), [fontSize, fontFamily]);

	const devicePixelRatio = PixelRatio.get();

	// Track which cells have completed animation
	const [completedAnimations, setCompletedAnimations] = useState<Set<string>>(new Set());

	// Create staggered animation data when cells change
	const staggeredAnimations = useMemo(() => {
		if (animatingCells.length === 0) return [];

		// Find center of animated cells for ripple effect
		const centerQ = Math.round(animatingCells.reduce((sum, cell) => sum + cell.q, 0) / animatingCells.length);
		const centerR = Math.round(animatingCells.reduce((sum, cell) => sum + cell.r, 0) / animatingCells.length);

		return createStaggeredAnimation(
			animatingCells.map((cell) => ({q: cell.q, r: cell.r})),
			{q: centerQ, r: centerR},
			// 40ms stagger delay
			40,
		);
	}, [animatingCells]);

	// Reset completed animations when new animations start
	useEffect(() => {
		if (animatingCells.length > 0) {
			setCompletedAnimations(new Set());
		}
	}, [animatingCells]);

	// Check if all animations are complete
	useEffect(() => {
		if (animatingCells.length > 0 && completedAnimations.size === animatingCells.length) {
			// All animations complete
			onAnimationComplete?.();
		}
	}, [completedAnimations, animatingCells.length, onAnimationComplete]);

	// Calculate actual rendering size with device pixel ratio
	const actualHexSize = hexSize * scale * devicePixelRatio;
	const actualOffsetX = offsetX * devicePixelRatio;
	const actualOffsetY = offsetY * devicePixelRatio;

	// Memoize hex paths for performance
	const hexPaths = useMemo(() => {
		const paths: Map<string, {path: SkPath; center: Point; height: number}> = new Map();

		grid.forEachHex((q, r, height) => {
			const center = hexToPixel(q, r, actualHexSize);
			const path = createHexPath(center.x, center.y, actualHexSize);
			paths.set(`${q},${r}`, {path, center, height});
		});

		return paths;
	}, [grid, actualHexSize]);

	// Memoize hint paths
	const hintPaths = useMemo(() => {
		return hintCells.map(({q, r}) => {
			const center = hexToPixel(q, r, actualHexSize);
			return createHexPath(center.x, center.y, actualHexSize * 0.95);
		});
	}, [hintCells, actualHexSize]);

	// Memoize invalid placement paths
	const invalidPaths = useMemo(() => {
		return invalidPlacementCells.map(({q, r}) => {
			const center = hexToPixel(q, r, actualHexSize);
			return createHexPath(center.x, center.y, actualHexSize);
		});
	}, [invalidPlacementCells, actualHexSize]);

	// Memoize valid placement paths
	const validPlacementPaths = useMemo(() => {
		return validPlacementCells.map(({q, r}) => {
			const center = hexToPixel(q, r, actualHexSize);
			return createHexPath(center.x, center.y, actualHexSize * 0.9);
		});
	}, [validPlacementCells, actualHexSize]);

	// Calculate preview piece positions
	const previewPaths = useMemo(() => {
		if (!hoveredHex || !selectedPiece) return [];

		return selectedPiece.tiles.map((tile) => {
			const worldQ = hoveredHex.q + tile.q - selectedPiece.center.q;
			const worldR = hoveredHex.r + tile.r - selectedPiece.center.r;
			const center = hexToPixel(worldQ, worldR, actualHexSize);
			return createHexPath(center.x, center.y, actualHexSize);
		});
	}, [hoveredHex, selectedPiece, actualHexSize]);

	// Get theme colors
	const gridLineColor = skiaTheme.colors.gridLines;

	return (
		<Group transform={[{translateX: actualOffsetX}, {translateY: actualOffsetY}]}>
			{/* Render hex grid */}
			{Array.from(hexPaths.entries()).map(([key, {path, center, height}]) => {
				const [q, r] = key.split(',').map(Number);
				const animatingCell = animatingCells.find((cell) => cell.q === q && cell.r === r);

				if (animatingCell) {
					// Find the stagger delay for this cell
					const staggerData = staggeredAnimations.find((item) => item.cell.q === q && item.cell.r === r);
					const delay = staggerData?.delay || 0;

					return (
						<Group key={key}>
							{/* Add a delayed wrapper for staggered animation */}
							{delay === 0 ? (
								<AnimatedHexCell
									path={path}
									centerX={center.x}
									centerY={center.y}
									hexSize={actualHexSize}
									startHeight={animatingCell.startHeight}
									endHeight={animatingCell.endHeight}
									theme={skiaTheme}
									gridLineColor={gridLineColor}
									font={font}
									fontSize={fontSize}
									animationDuration={400}
									onAnimationComplete={() => {
										setCompletedAnimations((prev) => new Set(prev).add(key));
									}}
								/>
							) : (
								<DelayedAnimatedHexCell
									key={`${key}-delayed`}
									delay={delay}
									path={path}
									center={center}
									height={height}
									animatingCell={animatingCell}
									actualHexSize={actualHexSize}
									skiaTheme={skiaTheme}
									gridLineColor={gridLineColor}
									font={font}
									fontSize={fontSize}
									onAnimationComplete={() => {
										setCompletedAnimations((prev) => new Set(prev).add(key));
									}}
								/>
							)}
						</Group>
					);
				}

				return (
					<Group key={key}>
						<Path
							path={path}
							color={getHeightColorFromTheme(height, skiaTheme)}
							style="fill"
						/>
						<Path
							path={path}
							color={gridLineColor}
							style="stroke"
							strokeWidth={2}
						/>
						{font && height > 0 && (
							<Text
								x={center.x}
								y={center.y + fontSize / 3}
								text={height.toString()}
								font={font}
								color={getContrastColor(getHeightColorFromTheme(height, skiaTheme))}
								opacity={0.9}
							/>
						)}
					</Group>
				);
			})}

			{/* Render hints */}
			{hintPaths.map((path, index) => (
				<Path
					key={`hint-${index}`}
					path={path}
					color={skiaTheme.colors.hintStroke}
					style="stroke"
					strokeWidth={3}
				>
					<DashPathEffect intervals={[10, 5]} />
				</Path>
			))}

			{/* Render valid placement areas */}
			{validPlacementPaths.map((path, index) => (
				<Path
					key={`valid-${index}`}
					path={path}
					color={withAlpha(skiaTheme.colors.selectionColor, 0.2)}
					style="fill"
				/>
			))}
			{validPlacementPaths.map((path, index) => (
				<Path
					key={`valid-stroke-${index}`}
					path={path}
					color={withAlpha(skiaTheme.colors.selectionColor, 0.6)}
					style="stroke"
					strokeWidth={2}
				>
					<DashPathEffect intervals={[8, 4]} />
				</Path>
			))}

			{/* Render invalid placements */}
			{invalidPaths.map((path, index) => (
				<Path
					key={`invalid-${index}`}
					path={path}
					color={skiaTheme.colors.invalidFill}
					style="fill"
				/>
			))}

			{/* Render piece preview */}
			{previewPaths.map((path, index) => {
				// Check if this preview position is valid
				if (!hoveredHex || !selectedPiece) return null;

				const tileIndex = index;
				const tile = selectedPiece.tiles[tileIndex];
				const worldQ = hoveredHex.q + tile.q - selectedPiece.center.q;
				const worldR = hoveredHex.r + tile.r - selectedPiece.center.r;
				const isValid = grid.isValidCoordinate(worldQ, worldR) && grid.getHeight(worldQ, worldR) > 0;

				return (
					<Group key={`preview-${index}`}>
						<Path
							path={path}
							color={isValid ? skiaTheme.colors.previewFill : skiaTheme.colors.invalidFill}
							style="fill"
						/>
						<Path
							path={path}
							color={isValid ? withAlpha(skiaTheme.colors.gridLines, 0.5) : skiaTheme.colors.invalidFill}
							style="stroke"
							strokeWidth={2}
						/>
					</Group>
				);
			})}
		</Group>
	);
};

/**
 * Compatibility class that matches the original HexRenderer interface
 */
export class SkiaHexRendererCompat {
	private grid: HexGrid;
	private hexSize: number;
	private offsetX: number = 0;
	private offsetY: number = 0;
	private scale: number = 1;
	private theme: ThemeType = 'dark';
	private hoveredHex: HexPoint | null = null;
	private selectedPiece: Piece | null = null;
	private hintCells: HexPoint[] = [];
	private invalidPlacementCells: HexPoint[] = [];
	private animatingCells: Array<{q: number; r: number; startHeight: number; endHeight: number}> = [];
	private onRenderCallback?: (props: SkiaHexRendererProps) => void;

	constructor(grid: HexGrid, hexSize: number) {
		this.grid = grid;
		this.hexSize = hexSize;
	}

	setRenderCallback(callback: (props: SkiaHexRendererProps) => void) {
		this.onRenderCallback = callback;
	}

	setOffset(x: number, y: number) {
		this.offsetX = x;
		this.offsetY = y;
		this.triggerRender();
	}

	setScale(scale: number) {
		this.scale = scale;
		this.triggerRender();
	}

	setTheme(theme: ThemeType) {
		this.theme = theme;
		this.triggerRender();
	}

	setHoveredHex(hex: HexPoint | null) {
		this.hoveredHex = hex;
		this.triggerRender();
	}

	setSelectedPiece(piece: Piece | null) {
		this.selectedPiece = piece;
		this.triggerRender();
	}

	setHintCells(cells: HexPoint[]) {
		this.hintCells = cells;
		this.triggerRender();
	}

	setInvalidPlacementCells(cells: HexPoint[]) {
		this.invalidPlacementCells = cells;
		this.triggerRender();
	}

	animatePlacement(cells: Array<{q: number; r: number; startHeight: number; endHeight: number}>) {
		this.animatingCells = cells;
		this.triggerRender();

		// Clear animation after completion
		setTimeout(() => {
			this.animatingCells = [];
			this.triggerRender();
		}, 500);
	}

	pixelToHex(x: number, y: number): HexPoint {
		const devicePixelRatio = PixelRatio.get();
		const actualHexSize = this.hexSize * this.scale * devicePixelRatio;
		const adjustedX = (x - this.offsetX) * devicePixelRatio;
		const adjustedY = (y - this.offsetY) * devicePixelRatio;
		return pixelToHex(adjustedX, adjustedY, actualHexSize);
	}

	pixelToHexWithHitTest(x: number, y: number): HexPoint | null {
		const devicePixelRatio = PixelRatio.get();
		const actualHexSize = this.hexSize * this.scale * devicePixelRatio;
		const adjustedX = (x - this.offsetX) * devicePixelRatio;
		const adjustedY = (y - this.offsetY) * devicePixelRatio;

		// Get the nearest hex coordinate using mathematical conversion
		const candidateHex = pixelToHex(adjustedX, adjustedY, actualHexSize);

		// Verify the touch point is actually within the hexagon boundaries
		if (this.grid.isValidCoordinate(candidateHex.q, candidateHex.r)) {
			const hexCenter = hexToPixel(candidateHex.q, candidateHex.r, actualHexSize);
			const isWithinHex = isPointInHex(adjustedX, adjustedY, hexCenter.x, hexCenter.y, actualHexSize);

			if (isWithinHex) {
				return candidateHex;
			}
		}

		// If the primary candidate isn't valid, check nearby hexes
		const searchRadius = 2;
		let closestHex: HexPoint | null = null;
		let closestDistance = Infinity;

		for (let dq = -searchRadius; dq <= searchRadius; dq++) {
			for (let dr = -searchRadius; dr <= searchRadius; dr++) {
				const testHex = {q: candidateHex.q + dq, r: candidateHex.r + dr};

				if (this.grid.isValidCoordinate(testHex.q, testHex.r)) {
					const testHexCenter = hexToPixel(testHex.q, testHex.r, actualHexSize);
					const isWithinTestHex = isPointInHex(
						adjustedX,
						adjustedY,
						testHexCenter.x,
						testHexCenter.y,
						actualHexSize,
					);

					if (isWithinTestHex) {
						return testHex;
					}

					// Track closest hex for fallback
					const distance = Math.sqrt(
						Math.pow(adjustedX - testHexCenter.x, 2) + Math.pow(adjustedY - testHexCenter.y, 2),
					);
					if (distance < closestDistance) {
						closestDistance = distance;
						closestHex = testHex;
					}
				}
			}
		}

		// As a last resort, return the closest hex if within reasonable distance
		// 1.5x hex size tolerance
		const maxDistance = actualHexSize * 1.5;
		if (closestHex && closestDistance <= maxDistance) {
			return closestHex;
		}

		return null;
	}

	hexToPixel(q: number, r: number): Point {
		const devicePixelRatio = PixelRatio.get();
		const actualHexSize = this.hexSize * this.scale * devicePixelRatio;
		const point = hexToPixel(q, r, actualHexSize);
		return {
			x: point.x / devicePixelRatio + this.offsetX,
			y: point.y / devicePixelRatio + this.offsetY,
		};
	}

	private triggerRender() {
		if (this.onRenderCallback) {
			this.onRenderCallback({
				grid: this.grid,
				hexSize: this.hexSize,
				offsetX: this.offsetX,
				offsetY: this.offsetY,
				scale: this.scale,
				theme: this.theme,
				hoveredHex: this.hoveredHex,
				selectedPiece: this.selectedPiece,
				hintCells: this.hintCells,
				invalidPlacementCells: this.invalidPlacementCells,
				animatingCells: this.animatingCells,
			});
		}
	}

	getProps(): SkiaHexRendererProps {
		return {
			grid: this.grid,
			hexSize: this.hexSize,
			offsetX: this.offsetX,
			offsetY: this.offsetY,
			scale: this.scale,
			theme: this.theme,
			hoveredHex: this.hoveredHex,
			selectedPiece: this.selectedPiece,
			hintCells: this.hintCells,
			invalidPlacementCells: this.invalidPlacementCells,
			animatingCells: this.animatingCells,
		};
	}
}
