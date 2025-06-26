import {describe, it, expect} from 'vitest';
import {
	hexToPixel,
	pixelToHex,
	roundHex,
	getHexCorners,
	calculateOptimalHexSize,
	hexDistance,
	isPointInHex,
	getHexBoundingBox,
	getHexNeighbors,
} from './hex-calculations';

describe('hex-calculations', () => {
	describe('hexToPixel', () => {
		it('converts hex coordinates to pixel coordinates', () => {
			const result = hexToPixel(0, 0, 30);
			expect(result).toEqual({x: 0, y: 0});
		});

		it('calculates correct pixel position for non-zero coordinates', () => {
			const result = hexToPixel(1, 1, 30);
			expect(result.x).toBeCloseTo(45);
			expect(result.y).toBeCloseTo(77.94, 1);
		});
	});

	describe('pixelToHex', () => {
		it('converts pixel coordinates back to hex coordinates', () => {
			const hexSize = 30;
			const original = {q: 2, r: 3};
			const pixel = hexToPixel(original.q, original.r, hexSize);
			const result = pixelToHex(pixel.x, pixel.y, hexSize);

			expect(result.q).toBe(original.q);
			expect(result.r).toBe(original.r);
		});
	});

	describe('roundHex', () => {
		it('rounds fractional hex coordinates correctly', () => {
			const result = roundHex(1.7, 2.1);
			expect(result.q).toBe(2);
			expect(result.r).toBe(2);
		});

		it('maintains constraint q + r + s = 0', () => {
			const result = roundHex(1.4, 2.4);
			const s = -result.q - result.r;
			expect(result.q + result.r + s).toBe(0);
		});
	});

	describe('getHexCorners', () => {
		it('returns 6 corner points', () => {
			const corners = getHexCorners(0, 0, 30);
			expect(corners).toHaveLength(6);
		});

		it('calculates correct corner positions', () => {
			const corners = getHexCorners(0, 0, 30);
			expect(corners[0].x).toBeCloseTo(30);
			expect(corners[0].y).toBeCloseTo(0);
			expect(corners[3].x).toBeCloseTo(-30);
			expect(corners[3].y).toBeCloseTo(0);
		});
	});

	describe('calculateOptimalHexSize', () => {
		it('returns positive hex size', () => {
			const result = calculateOptimalHexSize(800, 600, 4);
			expect(result).toBeGreaterThan(0);
		});

		it('respects minimum size constraint', () => {
			const result = calculateOptimalHexSize(100, 100, 10);
			expect(result).toBeGreaterThanOrEqual(10);
		});

		it('applies zoom factor correctly', () => {
			const normal = calculateOptimalHexSize(800, 600, 4, 1.0);
			const zoomed = calculateOptimalHexSize(800, 600, 4, 2.0);
			expect(zoomed).toBeCloseTo(normal * 2, 1);
		});
	});

	describe('hexDistance', () => {
		it('calculates distance between hex coordinates', () => {
			expect(hexDistance(0, 0, 0, 0)).toBe(0);
			expect(hexDistance(0, 0, 1, 0)).toBe(1);
			expect(hexDistance(0, 0, 2, -1)).toBe(2);
		});
	});

	describe('isPointInHex', () => {
		it('detects point inside hexagon', () => {
			expect(isPointInHex(0, 0, 0, 0, 30)).toBe(true);
			expect(isPointInHex(10, 10, 0, 0, 30)).toBe(true);
		});

		it('detects point outside hexagon', () => {
			expect(isPointInHex(50, 0, 0, 0, 30)).toBe(false);
			expect(isPointInHex(0, 60, 0, 0, 30)).toBe(false);
		});
	});

	describe('getHexBoundingBox', () => {
		it('calculates correct bounding box', () => {
			const box = getHexBoundingBox(100, 100, 30);
			expect(box.width).toBe(60);
			expect(box.height).toBeCloseTo(51.96, 1);
			expect(box.minX).toBe(70);
			expect(box.maxX).toBe(130);
		});
	});

	describe('getHexNeighbors', () => {
		it('returns 6 neighbors', () => {
			const neighbors = getHexNeighbors(0, 0);
			expect(neighbors).toHaveLength(6);
		});

		it('returns correct neighbor coordinates', () => {
			const neighbors = getHexNeighbors(0, 0);
			expect(neighbors).toContainEqual({q: 1, r: 0});
			expect(neighbors).toContainEqual({q: 0, r: 1});
			expect(neighbors).toContainEqual({q: -1, r: 1});
		});
	});
});
