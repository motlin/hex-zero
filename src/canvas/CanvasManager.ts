import {calculateHexSize} from '../canvas-utils';
import {MobilePerformanceOptimizer} from '../performance/MobilePerformanceOptimizer';

export class CanvasManager {
	private canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private previewCanvas: HTMLCanvasElement;
	private previewCtx: CanvasRenderingContext2D;
	private performanceOptimizer: MobilePerformanceOptimizer;

	constructor(canvasId: string, previewCanvasId: string) {
		this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
		this.ctx = this.canvas.getContext('2d', {
			alpha: false,
			desynchronized: true,
			willReadFrequently: false,
		})!;
		this.previewCanvas = document.getElementById(previewCanvasId) as HTMLCanvasElement;
		this.previewCtx = this.previewCanvas.getContext('2d', {
			alpha: false,
			desynchronized: true,
			willReadFrequently: false,
		})!;

		// Initialize performance optimizer
		this.performanceOptimizer = MobilePerformanceOptimizer.getInstance();
		this.performanceOptimizer.optimizeCanvasContext(this.ctx);
		this.performanceOptimizer.optimizeCanvasContext(this.previewCtx);
	}

	getCanvas(): HTMLCanvasElement {
		return this.canvas;
	}

	getContext(): CanvasRenderingContext2D {
		return this.ctx;
	}

	getPreviewCanvas(): HTMLCanvasElement {
		return this.previewCanvas;
	}

	getPreviewContext(): CanvasRenderingContext2D {
		return this.previewCtx;
	}

	updateCanvasSize(radius: number, zoomFactor: number): number {
		const rect = this.canvas.getBoundingClientRect();

		// Get optimal canvas size from performance optimizer
		const optimalSize = this.performanceOptimizer.getOptimalCanvasSize(rect.width, rect.height);

		// Set canvas size with optimized dimensions
		this.canvas.width = optimalSize.width;
		this.canvas.height = optimalSize.height;

		// Scale the context to ensure correct drawing dimensions
		this.ctx.setTransform(optimalSize.scale, 0, 0, optimalSize.scale, 0, 0);

		return calculateHexSize(rect.width, rect.height, radius, zoomFactor);
	}

	clearCanvas(backgroundColor: string): void {
		this.ctx.save();
		this.ctx.setTransform(1, 0, 0, 1, 0, 0);
		this.ctx.fillStyle = backgroundColor;
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
		this.ctx.restore();
	}

	clearPreviewCanvas(backgroundColor: string): void {
		this.previewCtx.fillStyle = backgroundColor;
		this.previewCtx.fillRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
	}

	drawHexOnCanvas(
		ctx: CanvasRenderingContext2D,
		x: number,
		y: number,
		size: number,
		fillColor: string,
		strokeColor: string,
		lineWidth: number,
	): void {
		ctx.beginPath();
		for (let i = 0; i < 6; i++) {
			const angle = (Math.PI / 3) * i;
			const hx = x + size * Math.cos(angle);
			const hy = y + size * Math.sin(angle);
			if (i === 0) {
				ctx.moveTo(hx, hy);
			} else {
				ctx.lineTo(hx, hy);
			}
		}
		ctx.closePath();

		ctx.fillStyle = fillColor;
		ctx.fill();

		ctx.strokeStyle = strokeColor;
		ctx.lineWidth = lineWidth;
		ctx.stroke();
	}
}
