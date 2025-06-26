import {describe, it, expect} from 'vitest';
import {
	calculateHexSize,
	calculateGameDimensions,
	calculateGridBounds,
	calculatePiecePanelDimensions,
	calculateZoomFactor,
	calculatePanLimits,
	clampPanOffset,
} from './game-dimensions';

describe('game-dimensions', () => {
	describe('calculateHexSize', () => {
		it('calculates hex size based on viewport and grid radius', () => {
			const hexSize = calculateHexSize(800, 600, 4);
			expect(hexSize).toBeGreaterThan(0);
			expect(hexSize).toBeLessThan(100);
		});

		it('applies zoom factor correctly', () => {
			const normalSize = calculateHexSize(800, 600, 4, 1.0);
			const zoomedSize = calculateHexSize(800, 600, 4, 2.0);
			expect(zoomedSize).toBeCloseTo(normalSize * 2, 1);
		});

		it('respects minimum size constraint', () => {
			const hexSize = calculateHexSize(100, 100, 10, 1.0);
			expect(hexSize).toBeGreaterThanOrEqual(10);
		});

		it('scales correctly for different grid sizes', () => {
			const smallGrid = calculateHexSize(800, 600, 3);
			const largeGrid = calculateHexSize(800, 600, 6);
			expect(smallGrid).toBeGreaterThan(largeGrid);
		});
	});

	describe('calculateGameDimensions', () => {
		it('returns complete game dimensions object', () => {
			const viewport = {width: 800, height: 600};
			const dimensions = calculateGameDimensions(viewport, 4);

			expect(dimensions).toHaveProperty('width', 800);
			expect(dimensions).toHaveProperty('height', 600);
			expect(dimensions).toHaveProperty('hexSize');
			expect(dimensions).toHaveProperty('scale', 1);
			expect(dimensions.hexSize).toBeGreaterThan(0);
		});

		it('applies zoom factor to scale', () => {
			const viewport = {width: 800, height: 600};
			const dimensions = calculateGameDimensions(viewport, 4, 1.5);
			expect(dimensions.scale).toBe(1.5);
		});
	});

	describe('calculateGridBounds', () => {
		it('calculates correct grid boundaries', () => {
			const bounds = calculateGridBounds(4, 30);

			// 30 * 3 * 4
			expect(bounds.width).toBe(360);
			// 30 * 2 * sqrt(3) * 4
			expect(bounds.height).toBeCloseTo(415.69, 1);
			expect(bounds.minX).toBe(-180);
			expect(bounds.maxX).toBe(180);
			expect(bounds.minY).toBeCloseTo(-207.85, 1);
			expect(bounds.maxY).toBeCloseTo(207.85, 1);
		});

		it('scales linearly with hex size', () => {
			const bounds1 = calculateGridBounds(4, 20);
			const bounds2 = calculateGridBounds(4, 40);

			expect(bounds2.width).toBe(bounds1.width * 2);
			expect(bounds2.height).toBeCloseTo(bounds1.height * 2, 1);
		});
	});

	describe('calculatePiecePanelDimensions', () => {
		it('calculates piece panel dimensions for default layout', () => {
			const panel = calculatePiecePanelDimensions(375);

			expect(panel.pieceSize).toBeGreaterThan(0);
			expect(panel.containerHeight).toBe(panel.pieceSize + 40);
			expect(panel.padding).toBe(20);
		});

		it('adjusts piece size based on pieces per row', () => {
			const panel1 = calculatePiecePanelDimensions(375, 3);
			const panel2 = calculatePiecePanelDimensions(375, 4);

			expect(panel1.pieceSize).toBeGreaterThan(panel2.pieceSize);
		});

		it('calculates correct piece size accounting for padding', () => {
			const viewportWidth = 400;
			const piecesPerRow = 3;
			const panel = calculatePiecePanelDimensions(viewportWidth, piecesPerRow);

			const containerPadding = 16;
			const betweenPiecePadding = 20;
			const availableWidth = viewportWidth - containerPadding * 2;
			const expectedPieceSize = Math.floor(
				(availableWidth - betweenPiecePadding * (piecesPerRow - 1)) / piecesPerRow,
			);

			expect(panel.pieceSize).toBe(expectedPieceSize);
		});
	});

	describe('calculateZoomFactor', () => {
		it('applies gesture scale to current zoom', () => {
			const newZoom = calculateZoomFactor(1.0, 1.5);
			expect(newZoom).toBe(1.5);
		});

		it('clamps zoom to minimum', () => {
			const newZoom = calculateZoomFactor(1.0, 0.1, 0.5, 2.0);
			expect(newZoom).toBe(0.5);
		});

		it('clamps zoom to maximum', () => {
			const newZoom = calculateZoomFactor(1.5, 2.0, 0.5, 2.0);
			expect(newZoom).toBe(2.0);
		});

		it('allows custom zoom limits', () => {
			const newZoom = calculateZoomFactor(1.0, 3.0, 0.1, 5.0);
			expect(newZoom).toBe(3.0);
		});
	});

	describe('calculatePanLimits', () => {
		it('returns zero limits when content fits viewport', () => {
			const viewport = {width: 800, height: 600};
			const gridBounds = {width: 400, height: 300};
			const limits = calculatePanLimits(viewport, gridBounds, 1.0);

			expect(limits.minX).toBe(-0);
			expect(limits.maxX).toBe(0);
			expect(limits.minY).toBe(-0);
			expect(limits.maxY).toBe(0);
		});

		it('calculates correct limits when content exceeds viewport', () => {
			const viewport = {width: 400, height: 300};
			const gridBounds = {width: 600, height: 400};
			const limits = calculatePanLimits(viewport, gridBounds, 1.0);

			expect(limits.minX).toBe(-100);
			expect(limits.maxX).toBe(100);
			expect(limits.minY).toBe(-50);
			expect(limits.maxY).toBe(50);
		});

		it('scales limits with zoom factor', () => {
			const viewport = {width: 400, height: 300};
			const gridBounds = {width: 400, height: 300};
			const limits = calculatePanLimits(viewport, gridBounds, 2.0);

			expect(limits.minX).toBe(-200);
			expect(limits.maxX).toBe(200);
			expect(limits.minY).toBe(-150);
			expect(limits.maxY).toBe(150);
		});
	});

	describe('clampPanOffset', () => {
		it('returns unchanged offset within limits', () => {
			const limits = {minX: -100, maxX: 100, minY: -50, maxY: 50};
			const clamped = clampPanOffset(50, 25, limits);

			expect(clamped.x).toBe(50);
			expect(clamped.y).toBe(25);
		});

		it('clamps to minimum values', () => {
			const limits = {minX: -100, maxX: 100, minY: -50, maxY: 50};
			const clamped = clampPanOffset(-200, -100, limits);

			expect(clamped.x).toBe(-100);
			expect(clamped.y).toBe(-50);
		});

		it('clamps to maximum values', () => {
			const limits = {minX: -100, maxX: 100, minY: -50, maxY: 50};
			const clamped = clampPanOffset(200, 100, limits);

			expect(clamped.x).toBe(100);
			expect(clamped.y).toBe(50);
		});

		it('handles zero limits', () => {
			const limits = {minX: 0, maxX: 0, minY: 0, maxY: 0};
			const clamped = clampPanOffset(50, 25, limits);

			expect(clamped.x).toBe(0);
			expect(clamped.y).toBe(0);
		});
	});
});
