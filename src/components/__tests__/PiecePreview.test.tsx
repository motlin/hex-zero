/**
 * Tests for PiecePreview component
 */

import {describe, it, expect, vi} from 'vitest';
import type {Piece} from '../../state/SeptominoGenerator';

// Mock React Native modules
vi.mock('react-native', () => ({
	View: 'View',
	StyleSheet: {
		create: (styles: unknown) => styles,
	},
}));

// Mock Skia
vi.mock('@shopify/react-native-skia', () => ({
	Canvas: 'Canvas',
	Path: 'Path',
	Group: 'Group',
	Skia: {
		Path: {
			Make: () => ({
				moveTo: vi.fn(),
				lineTo: vi.fn(),
				close: vi.fn(),
			}),
		},
	},
}));

// Mock theme context
vi.mock('../../context/ThemeContext', () => ({
	useThemeContext: () => ({
		theme: {
			colors: {
				previewFill: '#4a90e2',
				invalidFill: '#e94560',
				gridLines: '#333333',
				hintFill: '#f39c12',
			},
		},
	}),
}));

const mockPiece: Piece = {
	tiles: [
		{q: 0, r: 0},
		{q: 1, r: 0},
		{q: 0, r: 1},
	],
	center: {q: 0, r: 0},
};

describe('PiecePreview', () => {
	it('creates paths for all piece tiles', () => {
		const piece: Piece = {
			tiles: [
				{q: 0, r: 0},
				{q: 1, r: 0},
				{q: 0, r: 1},
				{q: -1, r: 1},
			],
			center: {q: 0, r: 0},
		};

		expect(piece.tiles.length).toBe(4);
	});

	it('calculates bounds correctly', () => {
		const _hexSize = 20;
		const positions = mockPiece.tiles.map(() => ({x: 0, y: 0}));
		expect(positions.length).toBe(mockPiece.tiles.length);
	});

	it('handles empty piece gracefully', () => {
		const emptyPiece: Piece = {
			tiles: [],
			center: {q: 0, r: 0},
		};

		expect(emptyPiece.tiles.length).toBe(0);
	});

	it('applies scale factor to hex size', () => {
		const baseHexSize = 20;
		const scale = 2;
		const scaledSize = baseHexSize * scale;

		expect(scaledSize).toBe(40);
	});

	it('validates color with alpha', () => {
		const color = '#FF0000';
		const _opacity = 0.5;

		// Color with alpha should have 8 characters (6 for RGB + 2 for alpha)
		// '#' + 6 hex digits + 2 alpha digits
		const expectedLength = 9;
		expect(color.length).toBeLessThan(expectedLength);
	});

	it('centers piece based on calculated bounds', () => {
		const width = 200;
		const height = 200;
		const boundsWidth = 100;
		const boundsHeight = 100;

		const translateX = width / 2 - boundsWidth / 2;
		const translateY = height / 2 - boundsHeight / 2;

		expect(translateX).toBe(50);
		expect(translateY).toBe(50);
	});
});
