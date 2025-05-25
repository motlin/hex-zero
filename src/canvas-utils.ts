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
	const padding = 60;

	const widthBasedHexSize = (canvasWidth - padding) / (radius * 3);
	const heightBasedHexSize = (canvasHeight - padding) / (radius * 2 * Math.sqrt(3));
	const baseHexSize = Math.min(widthBasedHexSize, heightBasedHexSize);

	const fitFactor = 0.9;

	const hexSize = Math.max(10, baseHexSize * fitFactor * zoomFactor);
	return hexSize;
}
