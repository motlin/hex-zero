/**
 * Skia-based hex renderer for React Native
 * Replaces HTML canvas-based HexRenderer
 */

import React, {useMemo, useRef, useEffect, useState} from 'react';
import {Path, Text, Group, Circle, DashPathEffect, interpolate, Extrapolate} from '@shopify/react-native-skia';
import {PixelRatio} from 'react-native';
import type {HexGrid} from '../state/HexGrid';
import type {Piece} from '../state/SeptominoGenerator';
import {hexToPixel, pixelToHex, type Point, type HexPoint} from '../utils/hex-calculations';
import {createHexPath, colorWithAlpha, getHeightColor} from '../utils/skia-drawing';
import type {SkPath} from '@shopify/react-native-skia';

interface SkiaHexRendererProps {
	grid: HexGrid;
	hexSize: number;
	offsetX?: number;
	offsetY?: number;
	scale?: number;
	theme?: 'light' | 'dark';
	showCoordinates?: boolean;
	hoveredHex?: HexPoint | null;
	selectedPiece?: Piece | null;
	hintCells?: HexPoint[];
	invalidPlacementCells?: HexPoint[];
	animatingCells?: Array<{q: number; r: number; startHeight: number; endHeight: number}>;
	onAnimationComplete?: () => void;
}

const colorMap: Record<number, string> = {
	1: '#e94560',
	2: '#ee6c4d',
	3: '#f3a261',
	4: '#f9c74f',
	5: '#f8dc81',
	6: '#e9d758',
	7: '#c9e265',
	8: '#90be6d',
	9: '#43aa8b',
	10: '#277da1',
};

export const SkiaHexRenderer: React.FC<SkiaHexRendererProps> = ({
	grid,
	hexSize,
	offsetX = 0,
	offsetY = 0,
	scale = 1,
	theme = 'light',
	showCoordinates = false,
	hoveredHex,
	selectedPiece,
	hintCells = [],
	invalidPlacementCells = [],
	animatingCells = [],
	onAnimationComplete,
}) => {
	// Font is loaded externally or passed as prop
	const font = null;
	const devicePixelRatio = PixelRatio.get();
	const [animationProgress, setAnimationProgress] = useState(0);
	const animationRef = useRef<number | null>(null);

	// Start animations when cells change
	useEffect(() => {
		if (animatingCells.length === 0) {
			return;
		}

		setAnimationProgress(0);
		const startTime = Date.now();
		const duration = 500;

		const animate = () => {
			const elapsed = Date.now() - startTime;
			const progress = Math.min(elapsed / duration, 1);
			setAnimationProgress(progress);

			if (progress < 1) {
				animationRef.current = requestAnimationFrame(animate);
			} else {
				onAnimationComplete?.();
			}
		};

		animationRef.current = requestAnimationFrame(animate);

		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [animatingCells, onAnimationComplete]);

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
	const textColor = theme === 'dark' ? '#ffffff' : '#000000';
	const gridLineColor = theme === 'dark' ? '#333333' : '#cccccc';

	return (
		<Group transform={[{translateX: actualOffsetX}, {translateY: actualOffsetY}]}>
			{/* Render hex grid */}
			{Array.from(hexPaths.entries()).map(([key, {path, center, height}]) => {
				const [q, r] = key.split(',').map(Number);
				const isAnimating = animatingCells.some((cell) => cell.q === q && cell.r === r);

				if (isAnimating) {
					const animatingCell = animatingCells.find((cell) => cell.q === q && cell.r === r)!;
					const animatedHeight = interpolate(
						animationProgress,
						[0, 1],
						[animatingCell.startHeight, animatingCell.endHeight],
						Extrapolate.CLAMP,
					);
					const burstRadius = interpolate(
						animationProgress,
						[0, 0.5, 1],
						[0, actualHexSize * 1.5, actualHexSize * 2],
						Extrapolate.CLAMP,
					);
					const burstOpacity = interpolate(animationProgress, [0, 0.5, 1], [0.8, 0.4, 0], Extrapolate.CLAMP);

					return (
						<Group key={key}>
							<Path
								path={path}
								color={getHeightColor(animatedHeight, colorMap)}
								style="fill"
							/>
							<Path
								path={path}
								color={gridLineColor}
								style="stroke"
								strokeWidth={1}
							/>
							{showCoordinates && font && (
								<Text
									x={center.x}
									y={center.y}
									text={Math.round(animatedHeight).toString()}
									font={font}
									color={textColor}
									opacity={0.8}
								/>
							)}
							{/* Burst animation */}
							<Circle
								cx={center.x}
								cy={center.y}
								r={burstRadius}
								color={colorWithAlpha('#ffffff', burstOpacity)}
								style="stroke"
								strokeWidth={3}
							/>
						</Group>
					);
				}

				return (
					<Group key={key}>
						<Path
							path={path}
							color={getHeightColor(height, colorMap)}
							style="fill"
						/>
						<Path
							path={path}
							color={gridLineColor}
							style="stroke"
							strokeWidth={1}
						/>
						{showCoordinates && font && height > 0 && (
							<Text
								x={center.x}
								y={center.y}
								text={height.toString()}
								font={font}
								color={textColor}
								opacity={0.8}
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
					color="#0066cc"
					style="stroke"
					strokeWidth={3}
				>
					<DashPathEffect intervals={[10, 5]} />
				</Path>
			))}

			{/* Render invalid placements */}
			{invalidPaths.map((path, index) => (
				<Path
					key={`invalid-${index}`}
					path={path}
					color={colorWithAlpha('#ff0000', 0.3)}
					style="fill"
				/>
			))}

			{/* Render piece preview */}
			{previewPaths.map((path, index) => (
				<Path
					key={`preview-${index}`}
					path={path}
					color={colorWithAlpha('#0066cc', 0.5)}
					style="fill"
				/>
			))}
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
	private theme: 'light' | 'dark' = 'light';
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

	setTheme(theme: 'light' | 'dark') {
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
