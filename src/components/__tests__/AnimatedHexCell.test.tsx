/**
 * Tests for AnimatedHexCell component
 */

import {describe, it, expect} from 'vitest';
import {createStaggeredAnimation} from '../AnimatedHexCell';

describe('🎯 AnimatedHexCell', () => {
	describe('createStaggeredAnimation', () => {
		it('should create staggered animations based on distance from center', () => {
			const cells = [
				// Center
				{q: 0, r: 0},
				// Adjacent
				{q: 1, r: 0},
				// Further
				{q: 2, r: 0},
				// Adjacent
				{q: 0, r: 1},
				// Further
				{q: 0, r: 2},
			];

			const centerHex = {q: 0, r: 0};
			const staggerDelay = 50;

			const result = createStaggeredAnimation(cells, centerHex, staggerDelay);

			// Should return all cells
			expect(result).toHaveLength(5);

			// Center cell should have 0 delay
			const centerCell = result.find((item) => item.cell.q === 0 && item.cell.r === 0);
			expect(centerCell?.delay).toBe(0);

			// Adjacent cells should have same delay
			const adjacentCells = result.filter(
				(item) => (item.cell.q === 1 && item.cell.r === 0) || (item.cell.q === 0 && item.cell.r === 1),
			);
			expect(adjacentCells).toHaveLength(2);
			expect(adjacentCells[0].delay).toBe(adjacentCells[1].delay);
			expect(adjacentCells[0].delay).toBeGreaterThan(0);

			// Further cells should have highest delay
			const furtherCells = result.filter(
				(item) => (item.cell.q === 2 && item.cell.r === 0) || (item.cell.q === 0 && item.cell.r === 2),
			);
			expect(furtherCells).toHaveLength(2);
			expect(furtherCells[0].delay).toBe(furtherCells[1].delay);
			expect(furtherCells[0].delay).toBeGreaterThan(adjacentCells[0].delay);
		});

		it('should handle single cell', () => {
			const cells = [{q: 5, r: 5}];
			const centerHex = {q: 0, r: 0};

			const result = createStaggeredAnimation(cells, centerHex);

			expect(result).toHaveLength(1);
			expect(result[0].cell).toEqual({q: 5, r: 5});
			expect(result[0].delay).toBe(0);
		});

		it('should use custom stagger delay', () => {
			const cells = [
				{q: 0, r: 0},
				{q: 1, r: 0},
				{q: 2, r: 0},
			];

			const centerHex = {q: 0, r: 0};
			const customDelay = 100;

			const result = createStaggeredAnimation(cells, centerHex, customDelay);

			// Check that delays are multiples of customDelay
			const delays = result.map((item) => item.delay);
			expect(delays[0]).toBe(0);
			expect(delays[1]).toBe(customDelay);
			expect(delays[2]).toBe(customDelay * 2);
		});
	});
});
