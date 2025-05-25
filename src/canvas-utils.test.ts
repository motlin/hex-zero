import {describe, it, expect} from 'vitest';
import {calculateHexSize} from './canvas-utils';

describe('calculateHexSize', () => {
	it('should never return zero or negative hex size', () => {
		const result = calculateHexSize(100, 100, 4);
		expect(result).toBeGreaterThan(0);
	});

	it('should calculate hex size that fits within canvas', () => {
		const canvasWidth = 800;
		const canvasHeight = 600;
		const radius = 4;
		const hexSize = calculateHexSize(canvasWidth, canvasHeight, radius);
		const padding = 60;
		const fitFactor = 0.9;

		const boardWidth = (radius * 3 * hexSize) / fitFactor + padding;
		const boardHeight = (radius * 2 * Math.sqrt(3) * hexSize) / fitFactor + padding;

		expect(boardWidth).toBeLessThanOrEqual(canvasWidth + 1);
		expect(boardHeight).toBeLessThanOrEqual(canvasHeight + 1);
	});

	it('should apply zoom factor correctly', () => {
		const normalHexSize = calculateHexSize(800, 600, 4, 1.0);
		const zoomedHexSize = calculateHexSize(800, 600, 4, 1.5);

		expect(zoomedHexSize).toBeCloseTo(normalHexSize * 1.5, 1);
	});

	it('should scale hex size based on canvas size', () => {
		const smallCanvasHexSize = calculateHexSize(400, 300, 4);
		const largeCanvasHexSize = calculateHexSize(1600, 1200, 4);

		expect(largeCanvasHexSize).toBeGreaterThan(smallCanvasHexSize);
	});

	it('should have minimum hex size', () => {
		const hexSize = calculateHexSize(50, 50, 8, 1.0);
		expect(hexSize).toBeGreaterThanOrEqual(10);
	});

	it('should fit larger radius boards in same canvas by reducing hex size', () => {
		const smallBoardHexSize = calculateHexSize(800, 600, 3);
		const largeBoardHexSize = calculateHexSize(800, 600, 8);

		expect(largeBoardHexSize).toBeLessThan(smallBoardHexSize);
	});
});
