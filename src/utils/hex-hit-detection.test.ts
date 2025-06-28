/**
 * Tests for enhanced hex hit detection functionality
 */

import {describe, it, expect} from 'vitest';
import {isPointInHex, hexToPixel, pixelToHex} from './hex-calculations';

describe('🔷 Enhanced Hex Hit Detection', () => {
	const hexSize = 30;
	const testHexQ = 0;
	const testHexR = 0;

	it('should correctly identify points inside hexagon', () => {
		const hexCenter = hexToPixel(testHexQ, testHexR, hexSize);

		// Test center point
		expect(isPointInHex(hexCenter.x, hexCenter.y, hexCenter.x, hexCenter.y, hexSize)).toBe(true);

		// Test points near center
		expect(isPointInHex(hexCenter.x + 5, hexCenter.y + 5, hexCenter.x, hexCenter.y, hexSize)).toBe(true);
		expect(isPointInHex(hexCenter.x - 5, hexCenter.y - 5, hexCenter.x, hexCenter.y, hexSize)).toBe(true);
	});

	it('should correctly identify points outside hexagon', () => {
		const hexCenter = hexToPixel(testHexQ, testHexR, hexSize);

		// Test points far from center
		expect(isPointInHex(hexCenter.x + 100, hexCenter.y, hexCenter.x, hexCenter.y, hexSize)).toBe(false);
		expect(isPointInHex(hexCenter.x, hexCenter.y + 100, hexCenter.x, hexCenter.y, hexSize)).toBe(false);
		expect(isPointInHex(hexCenter.x - 100, hexCenter.y - 100, hexCenter.x, hexCenter.y, hexSize)).toBe(false);
	});

	it('should handle edge cases near hexagon boundaries', () => {
		const hexCenter = hexToPixel(testHexQ, testHexR, hexSize);

		// Test points on the edge (these should be inside)
		// Just inside the boundary
		const edgeDistance = hexSize * 0.8;
		expect(isPointInHex(hexCenter.x + edgeDistance, hexCenter.y, hexCenter.x, hexCenter.y, hexSize)).toBe(true);
		expect(isPointInHex(hexCenter.x - edgeDistance, hexCenter.y, hexCenter.x, hexCenter.y, hexSize)).toBe(true);

		// Test points just outside the boundary (hexagon width is 3/2 * hexSize)
		// Beyond the 3/2 limit
		const outsideDistance = hexSize * 1.6;
		expect(isPointInHex(hexCenter.x + outsideDistance, hexCenter.y, hexCenter.x, hexCenter.y, hexSize)).toBe(false);
		expect(isPointInHex(hexCenter.x - outsideDistance, hexCenter.y, hexCenter.x, hexCenter.y, hexSize)).toBe(false);
	});

	it('should work with coordinate conversion round-trip', () => {
		// Test that pixelToHex and hexToPixel work together for hit detection
		const originalQ = 2;
		const originalR = -1;

		const pixelCoords = hexToPixel(originalQ, originalR, hexSize);
		const convertedHex = pixelToHex(pixelCoords.x, pixelCoords.y, hexSize);

		// Should convert back to original coordinates
		expect(convertedHex.q).toBe(originalQ);
		expect(convertedHex.r).toBe(originalR);

		// Center point should be inside the hexagon
		expect(isPointInHex(pixelCoords.x, pixelCoords.y, pixelCoords.x, pixelCoords.y, hexSize)).toBe(true);
	});

	it('should handle scaled coordinates correctly', () => {
		const scale = 2.0;
		const scaledHexSize = hexSize * scale;
		const hexCenter = hexToPixel(testHexQ, testHexR, scaledHexSize);

		// Scaled hexagon should contain larger area
		expect(isPointInHex(hexCenter.x + 40, hexCenter.y, hexCenter.x, hexCenter.y, scaledHexSize)).toBe(true);
		// Beyond scaled boundary (3/2 * scaledHexSize = 90)
		expect(isPointInHex(hexCenter.x + 100, hexCenter.y, hexCenter.x, hexCenter.y, scaledHexSize)).toBe(false);
	});
});
