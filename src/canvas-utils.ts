export interface CanvasDimensions {
	width: number;
	height: number;
	hexSize: number;
}

export function calculateHexSize(
	canvasWidth: number,
	canvasHeight: number,
	radius: number,
	zoomFactor: number = 1.0,
): number {
	const padding = 40;

	// Calculate hex size to fit the board within the canvas
	const widthBasedHexSize = (canvasWidth - padding) / (radius * 3);
	const heightBasedHexSize = (canvasHeight - padding) / (radius * 2 * Math.sqrt(3));
	const baseHexSize = Math.min(widthBasedHexSize, heightBasedHexSize);

	// Apply zoom factor for zoom in/out functionality
	const hexSize = Math.max(10, baseHexSize * zoomFactor);

	return hexSize;
}
