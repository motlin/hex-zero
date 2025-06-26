/**
 * Skia drawing utilities for React Native
 * Compatible with @shopify/react-native-skia
 */

import {Skia, type SkPath} from '@shopify/react-native-skia';
import {getHexCorners, type Point} from './hex-calculations';

/**
 * 🎨 Create a Skia path for a hexagon
 */
export function createHexPath(centerX: number, centerY: number, size: number): SkPath {
	const path = Skia.Path.Make();
	const corners = getHexCorners(centerX, centerY, size);

	if (corners.length > 0) {
		path.moveTo(corners[0].x, corners[0].y);
		for (let i = 1; i < corners.length; i++) {
			path.lineTo(corners[i].x, corners[i].y);
		}
		path.close();
	}

	return path;
}

/**
 * 🎨 Create paths for multiple hexagons
 */
export function createHexPaths(hexPositions: Point[], hexSize: number): SkPath[] {
	return hexPositions.map((pos) => createHexPath(pos.x, pos.y, hexSize));
}

/**
 * 🎨 Create a path for a piece (multiple hexagons)
 */
export function createPiecePath(tilePositions: Point[], hexSize: number): SkPath {
	const path = Skia.Path.Make();

	tilePositions.forEach((pos) => {
		const hexPath = createHexPath(pos.x, pos.y, hexSize);
		path.addPath(hexPath);
	});

	return path;
}

/**
 * 🎨 Convert color with alpha
 */
export function colorWithAlpha(color: string, alpha: number): string {
	if (color.startsWith('#')) {
		const hex = color.slice(1);
		const alphaHex = Math.round(alpha * 255)
			.toString(16)
			.padStart(2, '0');
		return `#${hex}${alphaHex}`;
	}
	return color;
}

/**
 * 🎨 Get color for hex height
 */
export function getHeightColor(height: number, colorMap: Record<number, string>): string {
	if (height === 0) return '#000000';
	if (height > 10) return '#1a1a1a';
	return colorMap[height] || '#333333';
}

/**
 * 🎨 Animation easing functions
 */
export const Easing = {
	linear: (t: number) => t,
	easeInOut: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
	easeInOutCubic: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
	easeOut: (t: number) => 1 - (1 - t) * (1 - t),
	bounce: (t: number) => {
		const n1 = 7.5625;
		const d1 = 2.75;
		if (t < 1 / d1) {
			return n1 * t * t;
		} else if (t < 2 / d1) {
			return n1 * (t -= 1.5 / d1) * t + 0.75;
		} else if (t < 2.5 / d1) {
			return n1 * (t -= 2.25 / d1) * t + 0.9375;
		} else {
			return n1 * (t -= 2.625 / d1) * t + 0.984375;
		}
	},
};

/**
 * 🎨 Calculate text size based on hex size
 */
export function calculateTextSize(hexSize: number): number {
	return Math.max(12, Math.floor(hexSize * 0.5));
}

/**
 * 🎨 Create gradient stops for height-based coloring
 */
export function createHeightGradientStops(maxHeight: number): Array<[number, string]> {
	const stops: Array<[number, string]> = [];
	const colors = [
		'#e94560',
		'#ee6c4d',
		'#f3a261',
		'#f9c74f',
		'#f8dc81',
		'#e9d758',
		'#c9e265',
		'#90be6d',
		'#43aa8b',
		'#277da1',
	];

	for (let i = 0; i <= maxHeight; i++) {
		const colorIndex = Math.min(i - 1, colors.length - 1);
		const position = i / maxHeight;
		stops.push([position, colors[colorIndex] || '#1a1a1a']);
	}

	return stops;
}
