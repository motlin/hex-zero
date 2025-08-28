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
	const padding = 80;

	// Width: Each column adds 1.5 * hexSize width (due to hex offset)
	// Height: Each row adds sqrt(3) * hexSize height
	const widthBasedHexSize = (canvasWidth - padding) / ((radius * 2 - 1) * 1.5 + 0.5);
	const heightBasedHexSize = (canvasHeight - padding) / ((radius * 2 - 1) * Math.sqrt(3));
	const baseHexSize = Math.min(widthBasedHexSize, heightBasedHexSize);

	const fitFactor = 0.85;

	const hexSize = Math.max(10, baseHexSize * fitFactor * zoomFactor);
	return hexSize;
}
