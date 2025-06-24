import {MobilePerformanceOptimizer} from './MobilePerformanceOptimizer';
import type {HexCoordinate} from '../state/HexGrid';

interface CachedHex {
	q: number;
	r: number;
	color: string;
	height: number;
	isDirty: boolean;
}

interface RenderBatch {
	hexes: CachedHex[];
	needsRedraw: boolean;
}

/**
 * ⚡ Optimized hex renderer with caching and batch rendering
 */
export class OptimizedHexRenderer {
	private performanceOptimizer: MobilePerformanceOptimizer;
	private hexCache: Map<string, CachedHex> = new Map();
	private dirtyRegions: Set<string> = new Set();
	private offscreenCanvas: HTMLCanvasElement | OffscreenCanvas | null = null;
	private offscreenCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null;
	private renderBatches: RenderBatch[] = [];
	private hexPathCache: Map<string, Path2D> = new Map();
	private textMetricsCache: Map<string, TextMetrics> = new Map();

	constructor() {
		this.performanceOptimizer = MobilePerformanceOptimizer.getInstance();
		this.initializeOffscreenCanvas();
	}

	private initializeOffscreenCanvas(): void {
		const size = this.performanceOptimizer.getMaxTextureSize();
		this.offscreenCanvas = this.performanceOptimizer.createOffscreenCanvas(size, size);
		this.offscreenCtx = this.offscreenCanvas.getContext('2d', {
			alpha: false,
			desynchronized: true,
			willReadFrequently: false,
		}) as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

		if (this.offscreenCtx) {
			this.performanceOptimizer.optimizeCanvasContext(this.offscreenCtx as CanvasRenderingContext2D);
		}
	}

	private getHexKey(q: number, r: number): string {
		return `${q},${r}`;
	}

	markDirty(q: number, r: number): void {
		this.dirtyRegions.add(this.getHexKey(q, r));
		const cached = this.hexCache.get(this.getHexKey(q, r));
		if (cached) {
			cached.isDirty = true;
		}
	}

	markRegionDirty(centerQ: number, centerR: number, radius: number): void {
		for (let q = -radius; q <= radius; q++) {
			for (let r = -radius; r <= radius; r++) {
				const s = -q - r;
				if (Math.abs(s) <= radius) {
					this.markDirty(centerQ + q, centerR + r);
				}
			}
		}
	}

	updateHexCache(q: number, r: number, color: string, height: number): void {
		const key = this.getHexKey(q, r);
		const existing = this.hexCache.get(key);

		if (!existing || existing.color !== color || existing.height !== height) {
			this.hexCache.set(key, {
				q,
				r,
				color,
				height,
				isDirty: true,
			});
			this.dirtyRegions.add(key);
		}
	}

	clearCache(): void {
		this.hexCache.clear();
		this.dirtyRegions.clear();
		this.hexPathCache.clear();
		this.textMetricsCache.clear();
	}

	private getHexPath(size: number): Path2D {
		const key = `hex_${size}`;
		let path = this.hexPathCache.get(key);

		if (!path) {
			path = new Path2D();
			for (let i = 0; i < 6; i++) {
				const angle = (Math.PI / 3) * i;
				const x = size * Math.cos(angle);
				const y = size * Math.sin(angle);
				if (i === 0) {
					path.moveTo(x, y);
				} else {
					path.lineTo(x, y);
				}
			}
			path.closePath();
			this.hexPathCache.set(key, path);
		}

		return path;
	}

	private prepareBatches(visibleHexes: HexCoordinate[]): void {
		this.renderBatches = [];
		const batchSize = this.performanceOptimizer.getBatchRenderingEnabled() ? 100 : visibleHexes.length;

		for (let i = 0; i < visibleHexes.length; i += batchSize) {
			const batch: RenderBatch = {
				hexes: [],
				needsRedraw: false,
			};

			for (let j = i; j < Math.min(i + batchSize, visibleHexes.length); j++) {
				const hex = visibleHexes[j];
				if (!hex) continue;
				const key = this.getHexKey(hex.q, hex.r);
				const cached = this.hexCache.get(key);

				if (cached) {
					batch.hexes.push(cached);
					if (cached.isDirty) {
						batch.needsRedraw = true;
					}
				}
			}

			this.renderBatches.push(batch);
		}
	}

	renderOptimized(
		ctx: CanvasRenderingContext2D,
		visibleHexes: HexCoordinate[],
		hexToPixel: (q: number, r: number) => {x: number; y: number},
		hexSize: number,
		currentTime: number,
	): void {
		// Update performance metrics
		this.performanceOptimizer.updateFrameMetrics(currentTime);

		// Skip frame if needed for performance
		if (this.performanceOptimizer.shouldSkipFrame(currentTime)) {
			return;
		}

		// Prepare render batches
		this.prepareBatches(visibleHexes);

		// Save context state
		ctx.save();

		// Apply platform-specific optimizations
		this.performanceOptimizer.optimizeCanvasContext(ctx);

		// Render batches
		const opts = this.performanceOptimizer.getRenderingOptimizations();

		for (const batch of this.renderBatches) {
			if (!batch.needsRedraw && this.offscreenCanvas && !this.performanceOptimizer.isReducedQualityMode()) {
				// Skip unchanged batches in high quality mode
				continue;
			}

			this.renderBatch(ctx, batch, hexToPixel, hexSize, opts);
		}

		// Clear dirty flags
		this.dirtyRegions.clear();
		this.hexCache.forEach((hex) => (hex.isDirty = false));

		// Restore context
		ctx.restore();
	}

	private renderBatch(
		ctx: CanvasRenderingContext2D,
		batch: RenderBatch,
		hexToPixel: (q: number, r: number) => {x: number; y: number},
		hexSize: number,
		_opts: ReturnType<MobilePerformanceOptimizer['getRenderingOptimizations']>,
	): void {
		const hexPath = this.getHexPath(hexSize);
		const fontSize = Math.max(12, Math.floor(hexSize * 0.5));
		const fontKey = `bold ${fontSize}px Arial`;

		// Set common styles for batch
		ctx.font = fontKey;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.lineWidth = 2;

		// Batch similar operations
		const hexesByColor = new Map<string, CachedHex[]>();

		for (const hex of batch.hexes) {
			const hexes = hexesByColor.get(hex.color) || [];
			hexes.push(hex);
			hexesByColor.set(hex.color, hexes);
		}

		// Render by color groups to minimize state changes
		hexesByColor.forEach((hexes, color) => {
			ctx.fillStyle = color;

			// Fill all hexes of the same color
			for (const hex of hexes) {
				const pos = hexToPixel(hex.q, hex.r);
				ctx.save();
				ctx.translate(pos.x, pos.y);
				ctx.fill(hexPath);
				ctx.restore();
			}
		});

		// Draw strokes in a separate pass
		ctx.strokeStyle = '#0f3460';
		for (const hex of batch.hexes) {
			const pos = hexToPixel(hex.q, hex.r);
			ctx.save();
			ctx.translate(pos.x, pos.y);
			ctx.stroke(hexPath);
			ctx.restore();
		}

		// Draw text in final pass
		ctx.fillStyle = '#fff';
		for (const hex of batch.hexes) {
			if (hex.height > 0) {
				const pos = hexToPixel(hex.q, hex.r);
				const text = hex.height.toString();

				// Use cached text metrics if available
				let metrics = this.textMetricsCache.get(text);
				if (!metrics) {
					metrics = ctx.measureText(text);
					this.textMetricsCache.set(text, metrics);
				}

				ctx.fillText(text, pos.x, pos.y);
			}
		}
	}

	// Memory optimization
	trimCache(maxSize: number = 1000): void {
		if (this.hexCache.size > maxSize) {
			// Remove oldest entries
			const entries = Array.from(this.hexCache.entries());
			const toRemove = entries.slice(0, entries.length - maxSize);
			toRemove.forEach(([key]) => this.hexCache.delete(key));
		}

		// Also trim path cache
		if (this.hexPathCache.size > 10) {
			this.hexPathCache.clear();
		}

		// Trim text metrics cache
		if (this.textMetricsCache.size > 100) {
			this.textMetricsCache.clear();
		}

		// Let the optimizer handle memory
		this.performanceOptimizer.optimizeMemoryUsage();
	}

	getPerformanceStats(): {
		fps: number;
		cacheSize: number;
		dirtyRegions: number;
		platform: string;
		reducedQuality: boolean;
	} {
		return {
			fps: this.performanceOptimizer.getCurrentFPS(),
			cacheSize: this.hexCache.size,
			dirtyRegions: this.dirtyRegions.size,
			platform: this.performanceOptimizer.getPlatform(),
			reducedQuality: this.performanceOptimizer.isReducedQualityMode(),
		};
	}
}
