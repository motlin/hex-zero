import {describe, it, expect, vi, beforeEach} from 'vitest';
import {SkiaHexRendererCompat} from './SkiaHexRenderer';
import {HexGrid} from '../state/HexGrid';
import type {Piece} from '../state/SeptominoGenerator';
import {PixelRatio} from 'react-native';

describe('SkiaHexRendererCompat', () => {
	let grid: HexGrid;
	let renderer: SkiaHexRendererCompat;

	beforeEach(() => {
		grid = new HexGrid(4);
		renderer = new SkiaHexRendererCompat(grid, 30);
		vi.clearAllMocks();
	});

	describe('coordinate conversions', () => {
		it('converts pixel to hex coordinates with device pixel ratio', () => {
			// With 2x pixel ratio, actual hex size is 60
			const hex = renderer.pixelToHex(45, 0);

			// At (45, 0) with hex size 60, we should get hex (1, 0)
			expect(hex.q).toBe(1);
			expect(hex.r).toBe(-0);
		});

		it('converts hex to pixel coordinates with device pixel ratio', () => {
			const pixel = renderer.hexToPixel(1, 0);

			// Hex (1, 0) should be at (45, 25.98) in screen coordinates due to hex geometry
			expect(pixel.x).toBeCloseTo(45, 0);
			expect(pixel.y).toBeCloseTo(25.98, 1);
		});

		it('handles offset in coordinate conversions', () => {
			renderer.setOffset(100, 50);

			// Pixel to hex should subtract offset
			const hex = renderer.pixelToHex(145, 50);
			expect(hex.q).toBe(1);
			expect(hex.r).toBe(-0);

			// Hex to pixel should add offset
			const pixel = renderer.hexToPixel(1, 0);
			expect(pixel.x).toBeCloseTo(145, 0);
			expect(pixel.y).toBeCloseTo(75.98, 1);
		});

		it('handles scale in coordinate conversions', () => {
			renderer.setScale(2);

			// With 2x scale and 2x pixel ratio, actual hex size is 120
			const hex = renderer.pixelToHex(90, 0);
			expect(hex.q).toBe(1);
			expect(hex.r).toBe(-0);

			const pixel = renderer.hexToPixel(1, 0);
			expect(pixel.x).toBeCloseTo(90, 0);
			expect(pixel.y).toBeCloseTo(51.96, 1);
		});

		it('handles different device pixel ratios', () => {
			// Test with 3x pixel ratio
			vi.mocked(PixelRatio.get).mockReturnValue(3);

			const newRenderer = new SkiaHexRendererCompat(grid, 30);

			// With 3x pixel ratio, actual hex size is 90
			const hex = newRenderer.pixelToHex(45, 0);
			expect(hex.q).toBe(1);
			expect(hex.r).toBe(-0);
		});
	});

	describe('render state management', () => {
		it('triggers render on offset change', () => {
			const renderCallback = vi.fn();
			renderer.setRenderCallback(renderCallback);

			renderer.setOffset(10, 20);

			expect(renderCallback).toHaveBeenCalledWith(
				expect.objectContaining({
					offsetX: 10,
					offsetY: 20,
				}),
			);
		});

		it('triggers render on scale change', () => {
			const renderCallback = vi.fn();
			renderer.setRenderCallback(renderCallback);

			renderer.setScale(1.5);

			expect(renderCallback).toHaveBeenCalledWith(
				expect.objectContaining({
					scale: 1.5,
				}),
			);
		});

		it('triggers render on theme change', () => {
			const renderCallback = vi.fn();
			renderer.setRenderCallback(renderCallback);

			renderer.setTheme('dark');

			expect(renderCallback).toHaveBeenCalledWith(
				expect.objectContaining({
					theme: 'dark',
				}),
			);
		});

		it('manages hovered hex state', () => {
			const renderCallback = vi.fn();
			renderer.setRenderCallback(renderCallback);

			const hex = {q: 1, r: 2};
			renderer.setHoveredHex(hex);

			expect(renderCallback).toHaveBeenCalledWith(
				expect.objectContaining({
					hoveredHex: hex,
				}),
			);
		});

		it('manages selected piece state', () => {
			const renderCallback = vi.fn();
			renderer.setRenderCallback(renderCallback);

			const piece: Piece = {tiles: [{q: 0, r: 0}], center: {q: 0, r: 0}};
			renderer.setSelectedPiece(piece);

			expect(renderCallback).toHaveBeenCalledWith(
				expect.objectContaining({
					selectedPiece: piece,
				}),
			);
		});

		it('manages hint cells', () => {
			const renderCallback = vi.fn();
			renderer.setRenderCallback(renderCallback);

			const hints = [
				{q: 1, r: 1},
				{q: 2, r: 0},
			];
			renderer.setHintCells(hints);

			expect(renderCallback).toHaveBeenCalledWith(
				expect.objectContaining({
					hintCells: hints,
				}),
			);
		});

		it('manages invalid placement cells', () => {
			const renderCallback = vi.fn();
			renderer.setRenderCallback(renderCallback);

			const invalidCells = [
				{q: 0, r: 1},
				{q: 1, r: 0},
			];
			renderer.setInvalidPlacementCells(invalidCells);

			expect(renderCallback).toHaveBeenCalledWith(
				expect.objectContaining({
					invalidPlacementCells: invalidCells,
				}),
			);
		});
	});

	describe('animation', () => {
		it('triggers animation for cell placements', () => {
			const renderCallback = vi.fn();
			renderer.setRenderCallback(renderCallback);

			const animatingCells = [
				{q: 0, r: 0, startHeight: 5, endHeight: 4},
				{q: 1, r: 0, startHeight: 3, endHeight: 2},
			];

			renderer.animatePlacement(animatingCells);

			expect(renderCallback).toHaveBeenCalledWith(
				expect.objectContaining({
					animatingCells,
				}),
			);
		});

		it('clears animation after timeout', async () => {
			vi.useFakeTimers();
			const renderCallback = vi.fn();
			renderer.setRenderCallback(renderCallback);

			renderer.animatePlacement([{q: 0, r: 0, startHeight: 5, endHeight: 4}]);

			// Initial call with animation
			expect(renderCallback).toHaveBeenCalledTimes(1);

			// Fast forward 500ms
			vi.advanceTimersByTime(500);

			// Should be called again with empty animation
			expect(renderCallback).toHaveBeenCalledTimes(2);
			expect(renderCallback).toHaveBeenLastCalledWith(
				expect.objectContaining({
					animatingCells: [],
				}),
			);

			vi.useRealTimers();
		});
	});

	describe('getProps', () => {
		it('returns current renderer state', () => {
			renderer.setOffset(10, 20);
			renderer.setScale(1.5);
			renderer.setTheme('dark');

			const hex = {q: 1, r: 1};
			renderer.setHoveredHex(hex);

			const props = renderer.getProps();

			expect(props).toEqual({
				grid,
				hexSize: 30,
				offsetX: 10,
				offsetY: 20,
				scale: 1.5,
				theme: 'dark',
				hoveredHex: hex,
				selectedPiece: null,
				hintCells: [],
				invalidPlacementCells: [],
				animatingCells: [],
			});
		});
	});
});
