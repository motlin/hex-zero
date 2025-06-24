import {calculateHexSize} from '../canvas-utils';
import {getRequiredElementById} from '../dom-utils';
import {MobilePerformanceOptimizer} from '../performance/MobilePerformanceOptimizer';

function getRequiredContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
	const ctx = canvas.getContext('2d', {
		alpha: false,
		desynchronized: true,
		willReadFrequently: false,
	});
	if (ctx === null) {
		throw new Error('Failed to get 2d rendering context');
	}
	return ctx;
}

export class CanvasManager {
	private readonly canvas: HTMLCanvasElement;
	private readonly ctx: CanvasRenderingContext2D;
	private readonly performanceOptimizer: MobilePerformanceOptimizer;

	constructor(canvasId: string) {
		this.canvas = getRequiredElementById(canvasId, HTMLCanvasElement);
		this.ctx = getRequiredContext(this.canvas);
		this.performanceOptimizer = MobilePerformanceOptimizer.getInstance();
		this.performanceOptimizer.optimizeCanvasContext(this.ctx);
	}

	getCanvas(): HTMLCanvasElement {
		return this.canvas;
	}

	getContext(): CanvasRenderingContext2D {
		return this.ctx;
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
