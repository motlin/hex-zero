/**
 * Pure mathematical hex calculations for React Native
 * No HTML canvas dependencies
 */

export interface Point {
	x: number;
	y: number;
}

export interface HexPoint {
	q: number;
	r: number;
}

/**
 * 🔷 Convert hex coordinates to pixel coordinates
 */
export function hexToPixel(q: number, r: number, hexSize: number): Point {
	const x = hexSize * ((3 / 2) * q);
	const y = hexSize * ((Math.sqrt(3) / 2) * q + Math.sqrt(3) * r);
	return {x, y};
}

/**
 * 🔷 Convert pixel coordinates to hex coordinates
 */
export function pixelToHex(x: number, y: number, hexSize: number): HexPoint {
	const q = ((2 / 3) * x) / hexSize;
	const r = ((-1 / 3) * x + (Math.sqrt(3) / 3) * y) / hexSize;
	return roundHex(q, r);
}

/**
 * 🔷 Round fractional hex coordinates to nearest integer coordinates
 */
export function roundHex(q: number, r: number): HexPoint {
	const s = -q - r;
	let roundedQ = Math.round(q);
	let roundedR = Math.round(r);
	const roundedS = Math.round(s);

	const qDiff = Math.abs(roundedQ - q);
	const rDiff = Math.abs(roundedR - r);
	const sDiff = Math.abs(roundedS - s);

	if (qDiff > rDiff && qDiff > sDiff) {
		roundedQ = -roundedR - roundedS;
	} else if (rDiff > sDiff) {
		roundedR = -roundedQ - roundedS;
	}

	return {q: roundedQ, r: roundedR};
}

/**
 * 🔷 Get the 6 corner points of a hexagon
 */
export function getHexCorners(centerX: number, centerY: number, size: number): Point[] {
	const corners: Point[] = [];
	for (let i = 0; i < 6; i++) {
		const angle = (Math.PI / 3) * i;
		const x = centerX + size * Math.cos(angle);
		const y = centerY + size * Math.sin(angle);
		corners.push({x, y});
	}
	return corners;
}

/**
 * 🔷 Calculate optimal hex size based on viewport dimensions
 */
export function calculateOptimalHexSize(
	viewportWidth: number,
	viewportHeight: number,
	gridRadius: number,
	zoomFactor: number = 1.0,
	padding: number = 60,
): number {
	const widthBasedHexSize = (viewportWidth - padding) / (gridRadius * 3);
	const heightBasedHexSize = (viewportHeight - padding) / (gridRadius * 2 * Math.sqrt(3));
	const baseHexSize = Math.min(widthBasedHexSize, heightBasedHexSize);

	const fitFactor = 0.9;
	const hexSize = Math.max(10, baseHexSize * fitFactor * zoomFactor);
	return hexSize;
}

/**
 * 🔷 Calculate distance between two hex coordinates
 */
export function hexDistance(q1: number, r1: number, q2: number, r2: number): number {
	return (Math.abs(q1 - q2) + Math.abs(q1 + r1 - q2 - r2) + Math.abs(r1 - r2)) / 2;
}

/**
 * 🔷 Check if a point is inside a hexagon
 */
export function isPointInHex(
	pointX: number,
	pointY: number,
	hexCenterX: number,
	hexCenterY: number,
	hexSize: number,
): boolean {
	const dx = Math.abs(pointX - hexCenterX);
	const dy = Math.abs(pointY - hexCenterY);

	if (dx > hexSize * (3 / 2)) return false;
	if (dy > hexSize * Math.sqrt(3)) return false;

	return hexSize * Math.sqrt(3) - dy >= (Math.sqrt(3) * dx) / 3;
}

/**
 * 🔷 Get bounding box for a hexagon
 */
export function getHexBoundingBox(
	centerX: number,
	centerY: number,
	size: number,
): {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
	width: number;
	height: number;
} {
	const width = size * 2;
	const height = size * Math.sqrt(3);

	return {
		minX: centerX - width / 2,
		minY: centerY - height / 2,
		maxX: centerX + width / 2,
		maxY: centerY + height / 2,
		width,
		height,
	};
}

/**
 * 🔷 Calculate center offset for a piece based on its tiles
 */
export function calculatePieceCenterOffset(tiles: HexPoint[]): HexPoint {
	const minQ = Math.min(...tiles.map((tile) => tile.q));
	const maxQ = Math.max(...tiles.map((tile) => tile.q));
	const minR = Math.min(...tiles.map((tile) => tile.r));
	const maxR = Math.max(...tiles.map((tile) => tile.r));

	return {
		q: Math.floor((minQ + maxQ) / 2),
		r: Math.floor((minR + maxR) / 2),
	};
}

/**
 * 🔷 Get neighboring hex coordinates
 */
export function getHexNeighbors(q: number, r: number): HexPoint[] {
	return [
		{q: q + 1, r: r},
		{q: q + 1, r: r - 1},
		{q: q, r: r - 1},
		{q: q - 1, r: r},
		{q: q - 1, r: r + 1},
		{q: q, r: r + 1},
	];
}
