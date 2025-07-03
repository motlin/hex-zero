/**
 * Optimized hex hit detection with spatial indexing
 * Reduces touch latency by caching hex boundaries and using spatial lookup
 */

import type {HexPoint} from './hex-calculations';
import {hexToPixel, isPointInHex} from './hex-calculations';

interface HexBounds {
	minX: number;
	maxX: number;
	minY: number;
	maxY: number;
	center: {x: number; y: number};
}

export class OptimizedHexHitDetector {
	private hexBoundsCache: Map<string, HexBounds> = new Map();
	private spatialIndex: Map<string, HexPoint[]> = new Map();
	// Size of spatial grid cells
	private gridSize = 100;

	constructor(
		private hexSize: number,
		private hexes: HexPoint[],
	) {
		this.buildCaches();
	}

	/**
	 * Build spatial index and bounds cache for fast lookups
	 */
	private buildCaches() {
		this.hexBoundsCache.clear();
		this.spatialIndex.clear();

		for (const hex of this.hexes) {
			const key = `${hex.q},${hex.r}`;
			const center = hexToPixel(hex.q, hex.r, this.hexSize);

			// Calculate hex bounds
			const width = Math.sqrt(3) * this.hexSize;
			const height = 2 * this.hexSize;

			const bounds: HexBounds = {
				minX: center.x - width / 2,
				maxX: center.x + width / 2,
				minY: center.y - height / 2,
				maxY: center.y + height / 2,
				center,
			};

			this.hexBoundsCache.set(key, bounds);

			// Add to spatial index
			const gridX = Math.floor(center.x / this.gridSize);
			const gridY = Math.floor(center.y / this.gridSize);

			// Add to multiple grid cells if hex overlaps boundaries
			for (let dx = -1; dx <= 1; dx++) {
				for (let dy = -1; dy <= 1; dy++) {
					const gridKey = `${gridX + dx},${gridY + dy}`;
					if (!this.spatialIndex.has(gridKey)) {
						this.spatialIndex.set(gridKey, []);
					}
					this.spatialIndex.get(gridKey)!.push(hex);
				}
			}
		}
	}

	/**
	 * Fast hit detection using spatial index
	 */
	findHexAtPoint(x: number, y: number): HexPoint | null {
		// First check spatial index for candidates
		const gridX = Math.floor(x / this.gridSize);
		const gridY = Math.floor(y / this.gridSize);
		const gridKey = `${gridX},${gridY}`;

		const candidates = this.spatialIndex.get(gridKey) || [];

		// Check candidates using cached bounds
		for (const hex of candidates) {
			const key = `${hex.q},${hex.r}`;
			const bounds = this.hexBoundsCache.get(key);

			if (!bounds) continue;

			// Quick bounds check
			if (x < bounds.minX || x > bounds.maxX || y < bounds.minY || y > bounds.maxY) {
				continue;
			}

			// Precise hex check
			if (isPointInHex(x, y, bounds.center.x, bounds.center.y, this.hexSize)) {
				return hex;
			}
		}

		return null;
	}

	/**
	 * Update hex size and rebuild caches
	 */
	updateHexSize(newSize: number) {
		this.hexSize = newSize;
		this.buildCaches();
	}

	/**
	 * Clear all caches
	 */
	clear() {
		this.hexBoundsCache.clear();
		this.spatialIndex.clear();
	}
}

/**
 * Create a worklet-compatible hit detection function
 */
export function createHitDetectionWorklet(hexes: HexPoint[], hexSize: number) {
	'worklet';

	// Pre-calculate hex centers for worklet use
	const hexCenters = hexes.map((hex) => ({
		q: hex.q,
		r: hex.r,
		...hexToPixel(hex.q, hex.r, hexSize),
	}));

	return (x: number, y: number): HexPoint | null => {
		'worklet';

		// Simple distance-based check for worklet compatibility
		let closest: HexPoint | null = null;
		let closestDistance = Infinity;

		for (const hex of hexCenters) {
			const dx = x - hex.x;
			const dy = y - hex.y;
			const distance = Math.sqrt(dx * dx + dy * dy);

			if (distance < hexSize && distance < closestDistance) {
				// Verify with precise hex check
				if (isPointInHex(x, y, hex.x, hex.y, hexSize)) {
					closest = {q: hex.q, r: hex.r};
					closestDistance = distance;
				}
			}
		}

		return closest;
	};
}
