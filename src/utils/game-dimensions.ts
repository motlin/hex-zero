/**
 * Game dimension calculations for React Native
 * Platform-agnostic sizing utilities
 */

export interface GameDimensions {
	width: number;
	height: number;
	hexSize: number;
	scale: number;
}

export interface ViewportDimensions {
	width: number;
	height: number;
}

/**
 * 📐 Calculate hex size based on viewport and grid radius
 */
export function calculateHexSize(
	viewportWidth: number,
	viewportHeight: number,
	gridRadius: number,
	zoomFactor: number = 1.0,
): number {
	const padding = 60;

	const widthBasedHexSize = (viewportWidth - padding) / (gridRadius * 3);
	const heightBasedHexSize = (viewportHeight - padding) / (gridRadius * 2 * Math.sqrt(3));
	const baseHexSize = Math.min(widthBasedHexSize, heightBasedHexSize);

	const fitFactor = 0.9;

	const hexSize = Math.max(10, baseHexSize * fitFactor * zoomFactor);
	return hexSize;
}

/**
 * 📐 Calculate game board dimensions
 */
export function calculateGameDimensions(
	viewport: ViewportDimensions,
	gridRadius: number,
	zoomFactor: number = 1.0,
): GameDimensions {
	const hexSize = calculateHexSize(viewport.width, viewport.height, gridRadius, zoomFactor);

	return {
		width: viewport.width,
		height: viewport.height,
		hexSize,
		scale: zoomFactor,
	};
}

/**
 * 📐 Calculate bounds for a hex grid
 */
export function calculateGridBounds(
	gridRadius: number,
	hexSize: number,
): {width: number; height: number; minX: number; minY: number; maxX: number; maxY: number} {
	const width = hexSize * 3 * gridRadius;
	const height = hexSize * 2 * Math.sqrt(3) * gridRadius;

	return {
		width,
		height,
		minX: -width / 2,
		minY: -height / 2,
		maxX: width / 2,
		maxY: height / 2,
	};
}

/**
 * 📐 Calculate piece panel dimensions
 */
export function calculatePiecePanelDimensions(
	viewportWidth: number,
	piecesPerRow: number = 3,
): {pieceSize: number; containerHeight: number; padding: number} {
	const padding = 20;
	const containerPadding = 16;
	const availableWidth = viewportWidth - containerPadding * 2;
	const pieceSize = Math.floor((availableWidth - padding * (piecesPerRow - 1)) / piecesPerRow);
	const containerHeight = pieceSize + 40;

	return {
		pieceSize,
		containerHeight,
		padding,
	};
}

/**
 * 📐 Convert zoom gesture scale to zoom factor
 */
export function calculateZoomFactor(
	currentZoom: number,
	gestureScale: number,
	minZoom: number = 0.5,
	maxZoom: number = 2.0,
): number {
	const newZoom = currentZoom * gestureScale;
	return Math.max(minZoom, Math.min(maxZoom, newZoom));
}

/**
 * 📐 Calculate pan limits based on zoom
 */
export function calculatePanLimits(
	viewportDimensions: ViewportDimensions,
	gridBounds: {width: number; height: number},
	zoomFactor: number,
): {minX: number; maxX: number; minY: number; maxY: number} {
	const scaledWidth = gridBounds.width * zoomFactor;
	const scaledHeight = gridBounds.height * zoomFactor;

	const maxPanX = Math.max(0, (scaledWidth - viewportDimensions.width) / 2);
	const maxPanY = Math.max(0, (scaledHeight - viewportDimensions.height) / 2);

	return {
		minX: -maxPanX,
		maxX: maxPanX,
		minY: -maxPanY,
		maxY: maxPanY,
	};
}

/**
 * 📐 Clamp pan offset within limits
 */
export function clampPanOffset(
	offsetX: number,
	offsetY: number,
	limits: {minX: number; maxX: number; minY: number; maxY: number},
): {x: number; y: number} {
	return {
		x: Math.max(limits.minX, Math.min(limits.maxX, offsetX)),
		y: Math.max(limits.minY, Math.min(limits.maxY, offsetY)),
	};
}
