import {describe, it, expect, vi} from 'vitest';
import {HexGrid} from '../state/HexGrid';
import {createHexPath, getHeightColor, calculateTextSize} from '../utils/skia-drawing';
import {hexToPixel} from '../utils/hex-calculations';

// Mock React Native
vi.mock('react-native', () => ({
	PixelRatio: {
		get: () => 1,
	},
	Platform: {
		select: () => 'Arial',
	},
}));

// Mock Skia Path
vi.mock('@shopify/react-native-skia', () => ({
	Skia: {
		Path: {
			Make: () => ({
				moveTo: vi.fn(),
				lineTo: vi.fn(),
				close: vi.fn(),
				toSVGString: () => 'M10,10 L20,10 L30,20 L20,30 L10,30 L0,20 Z',
			}),
		},
	},
}));

describe('Skia Hex Grid Rendering', () => {
	describe('hex shape drawing', () => {
		it('creates valid hex path', () => {
			const path = createHexPath(100, 100, 30);
			expect(path).toBeDefined();
			// Path should have 6 corners plus close
			expect(path.toSVGString()).toMatch(/M.*L.*L.*L.*L.*L.*Z/);
		});

		it('creates hex paths at correct positions', () => {
			const hexSize = 30;
			const positions = [
				{q: 0, r: 0},
				{q: 1, r: 0},
				{q: 0, r: 1},
			];

			positions.forEach(({q, r}) => {
				const pixel = hexToPixel(q, r, hexSize);
				const path = createHexPath(pixel.x, pixel.y, hexSize);
				expect(path).toBeDefined();
			});
		});
	});

	describe('grid rendering with spacing', () => {
		it('calculates proper hex positions for grid', () => {
			const grid = new HexGrid(3);
			const hexSize = 30;
			const positions: Array<{q: number; r: number; x: number; y: number}> = [];

			grid.forEachHex((q, r) => {
				const pixel = hexToPixel(q, r, hexSize);
				positions.push({q, r, x: pixel.x, y: pixel.y});
			});

			// Check that hexes are properly spaced
			const hex00 = positions.find((p) => p.q === 0 && p.r === 0);
			const hex10 = positions.find((p) => p.q === 1 && p.r === 0);
			const hex01 = positions.find((p) => p.q === 0 && p.r === 1);

			expect(hex00).toBeDefined();
			expect(hex10).toBeDefined();
			expect(hex01).toBeDefined();

			// Horizontal spacing
			const horizontalSpacing = hex10!.x - hex00!.x;
			expect(horizontalSpacing).toBeCloseTo(hexSize * 1.5, 1);

			// Vertical component
			const verticalOffset = hex01!.y - hex00!.y;
			expect(verticalOffset).toBeCloseTo(hexSize * Math.sqrt(3), 1);
		});
	});

	describe('height display', () => {
		it('calculates appropriate text size based on hex size', () => {
			// Minimum size
			expect(calculateTextSize(20)).toBe(12);
			expect(calculateTextSize(30)).toBe(15);
			expect(calculateTextSize(40)).toBe(20);
			expect(calculateTextSize(50)).toBe(25);
		});

		it('maps heights to correct colors', () => {
			const colorMap = {
				1: '#e94560',
				2: '#ee6c4d',
				3: '#f3a261',
				4: '#f9c74f',
				5: '#f8dc81',
				6: '#e9d758',
				7: '#c9e265',
				8: '#90be6d',
				9: '#43aa8b',
				10: '#277da1',
			};

			expect(getHeightColor(0, colorMap)).toBe('#000000');
			expect(getHeightColor(1, colorMap)).toBe('#e94560');
			expect(getHeightColor(5, colorMap)).toBe('#f8dc81');
			expect(getHeightColor(10, colorMap)).toBe('#277da1');
			expect(getHeightColor(11, colorMap)).toBe('#1a1a1a');
		});
	});

	describe('grid integration', () => {
		it('renders all hexes in grid', () => {
			const grid = new HexGrid(2);
			let hexCount = 0;

			grid.forEachHex(() => {
				hexCount++;
			});

			// A radius 2 grid should have 19 hexes
			expect(hexCount).toBe(19);
		});

		it('assigns heights correctly', () => {
			const grid = new HexGrid(3);

			// Set some test heights
			grid.forEachHex((q, r) => {
				const hex = grid.getHex(q, r);
				if (hex) {
					hex.height = Math.abs(q) + Math.abs(r);
				}
			});

			// Verify heights
			expect(grid.getHex(0, 0)?.height).toBe(0);
			expect(grid.getHex(1, 0)?.height).toBe(1);
			expect(grid.getHex(0, 1)?.height).toBe(1);
			expect(grid.getHex(1, 1)?.height).toBe(2);
		});
	});
});
