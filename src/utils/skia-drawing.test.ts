import {describe, it, expect, vi} from 'vitest';
import {
	createHexPath,
	createHexPaths,
	createPiecePath,
	colorWithAlpha,
	getHeightColor,
	Easing,
	calculateTextSize,
	createHeightGradientStops,
} from './skia-drawing';

// Mock Skia module
vi.mock('@shopify/react-native-skia', () => ({
	Skia: {
		Path: {
			Make: () => ({
				moveTo: vi.fn(),
				lineTo: vi.fn(),
				close: vi.fn(),
				addPath: vi.fn(),
			}),
		},
	},
}));

describe('skia-drawing', () => {
	describe('createHexPath', () => {
		it('creates a path with 6 corners', () => {
			const path = createHexPath(0, 0, 30);

			expect(path.moveTo).toHaveBeenCalledTimes(1);
			expect(path.lineTo).toHaveBeenCalledTimes(5);
			expect(path.close).toHaveBeenCalledTimes(1);
		});

		it('starts at correct position', () => {
			const path = createHexPath(0, 0, 30);

			expect(path.moveTo).toHaveBeenCalledWith(30, 0);
		});
	});

	describe('createHexPaths', () => {
		it('creates multiple hex paths', () => {
			const positions = [
				{x: 0, y: 0},
				{x: 50, y: 50},
				{x: 100, y: 100},
			];

			const paths = createHexPaths(positions, 30);

			expect(paths).toHaveLength(3);
			paths.forEach((path) => {
				expect(path.moveTo).toHaveBeenCalled();
				expect(path.close).toHaveBeenCalled();
			});
		});
	});

	describe('createPiecePath', () => {
		it('combines multiple hex paths into one', () => {
			const tilePositions = [
				{x: 0, y: 0},
				{x: 45, y: 0},
				{x: 22.5, y: 39},
			];

			const path = createPiecePath(tilePositions, 30);

			expect(path.addPath).toHaveBeenCalledTimes(3);
		});
	});

	describe('colorWithAlpha', () => {
		it('adds alpha to hex color', () => {
			const result = colorWithAlpha('#ff0000', 0.5);
			expect(result).toBe('#ff000080');
		});

		it('handles full opacity', () => {
			const result = colorWithAlpha('#00ff00', 1.0);
			expect(result).toBe('#00ff00ff');
		});

		it('handles zero opacity', () => {
			const result = colorWithAlpha('#0000ff', 0);
			expect(result).toBe('#0000ff00');
		});

		it('returns non-hex colors unchanged', () => {
			const result = colorWithAlpha('red', 0.5);
			expect(result).toBe('red');
		});

		it('pads alpha hex with leading zero', () => {
			const result = colorWithAlpha('#ffffff', 0.05);
			expect(result).toBe('#ffffff0d');
		});
	});

	describe('getHeightColor', () => {
		const colorMap = {
			1: '#e94560',
			2: '#ee6c4d',
			3: '#f3a261',
			4: '#f9c74f',
			5: '#f8dc81',
		};

		it('returns black for height 0', () => {
			const color = getHeightColor(0, colorMap);
			expect(color).toBe('#000000');
		});

		it('returns correct color from map', () => {
			const color = getHeightColor(3, colorMap);
			expect(color).toBe('#f3a261');
		});

		it('returns dark gray for height > 10', () => {
			const color = getHeightColor(15, colorMap);
			expect(color).toBe('#1a1a1a');
		});

		it('returns default color for unmapped height', () => {
			const color = getHeightColor(6, colorMap);
			expect(color).toBe('#333333');
		});
	});

	describe('Easing', () => {
		it('linear easing returns input unchanged', () => {
			expect(Easing.linear(0)).toBe(0);
			expect(Easing.linear(0.5)).toBe(0.5);
			expect(Easing.linear(1)).toBe(1);
		});

		it('easeInOut starts slow and ends slow', () => {
			expect(Easing.easeInOut(0)).toBe(0);
			expect(Easing.easeInOut(0.25)).toBeLessThan(0.25);
			expect(Easing.easeInOut(0.5)).toBe(0.5);
			expect(Easing.easeInOut(0.75)).toBeGreaterThan(0.75);
			expect(Easing.easeInOut(1)).toBe(1);
		});

		it('easeInOutCubic provides smooth cubic curve', () => {
			expect(Easing.easeInOutCubic(0)).toBe(0);
			expect(Easing.easeInOutCubic(0.5)).toBe(0.5);
			expect(Easing.easeInOutCubic(1)).toBe(1);
		});

		it('easeOut decelerates', () => {
			expect(Easing.easeOut(0)).toBe(0);
			expect(Easing.easeOut(0.5)).toBeGreaterThan(0.5);
			expect(Easing.easeOut(1)).toBe(1);
		});

		it('bounce creates bounce effect', () => {
			expect(Easing.bounce(0)).toBe(0);
			expect(Easing.bounce(1)).toBeCloseTo(1, 5);

			// Check characteristic bounce pattern
			const mid = Easing.bounce(0.5);
			expect(mid).toBeGreaterThan(0);
			expect(mid).toBeLessThan(1);
		});
	});

	describe('calculateTextSize', () => {
		it('scales with hex size', () => {
			const small = calculateTextSize(20);
			const large = calculateTextSize(40);

			expect(large).toBeGreaterThan(small);
		});

		it('respects minimum size', () => {
			const tiny = calculateTextSize(10);
			expect(tiny).toBeGreaterThanOrEqual(12);
		});

		it('calculates reasonable text sizes', () => {
			expect(calculateTextSize(30)).toBe(15);
			expect(calculateTextSize(50)).toBe(25);
			expect(calculateTextSize(100)).toBe(50);
		});
	});

	describe('createHeightGradientStops', () => {
		it('creates correct number of stops', () => {
			const stops = createHeightGradientStops(10);
			// 0 to 10 inclusive
			expect(stops).toHaveLength(11);
		});

		it('creates stops with correct positions', () => {
			const stops = createHeightGradientStops(5);

			expect(stops[0][0]).toBe(0);
			expect(stops[1][0]).toBe(0.2);
			expect(stops[2][0]).toBe(0.4);
			expect(stops[3][0]).toBe(0.6);
			expect(stops[4][0]).toBe(0.8);
			expect(stops[5][0]).toBe(1);
		});

		it('assigns colors correctly', () => {
			const stops = createHeightGradientStops(5);

			// height 0 gets fallback color (index -1)
			expect(stops[0][1]).toBe('#1a1a1a');
			// height 1 gets first color (index 0)
			expect(stops[1][1]).toBe('#e94560');
			// height 2 gets second color (index 1)
			expect(stops[2][1]).toBe('#ee6c4d');
		});

		it('handles large max heights', () => {
			const stops = createHeightGradientStops(20);
			expect(stops).toHaveLength(21);

			// Colors array has 10 elements, so index 9 is the last color
			// Height 15 -> index 14, clamped to 9 -> '#277da1'
			expect(stops[15][1]).toBe('#277da1');
			// Height 20 -> index 19, clamped to 9 -> '#277da1'
			expect(stops[20][1]).toBe('#277da1');
		});
	});
});
