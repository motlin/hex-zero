import {calculateHexSize} from '../canvas-utils';
import {MobilePerformanceOptimizer} from '../performance/MobilePerformanceOptimizer';
import {DeviceVariationOptimizer} from '../device-variation-optimizer';

export class CanvasManager {
	private canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private previewCanvas: HTMLCanvasElement;
	private previewCtx: CanvasRenderingContext2D;
	private performanceOptimizer: MobilePerformanceOptimizer;
	private deviceOptimizer: DeviceVariationOptimizer;

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

		// Initialize device optimizer
		this.deviceOptimizer = DeviceVariationOptimizer.getInstance();
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

		const optimalSize = this.performanceOptimizer.getOptimalCanvasSize(rect.width, rect.height);

		// For iOS, we don't need additional device-specific scaling since
		// the performance optimizer already handles devicePixelRatio
		const isIOS = this.deviceOptimizer.getDeviceInfo()?.platform === 'ios';
		const deviceCanvasScale = isIOS ? 1.0 : this.deviceOptimizer.getCanvasScale();
		const finalScale = optimalSize.scale * deviceCanvasScale;

		this.canvas.width = optimalSize.width;
		this.canvas.height = optimalSize.height;

		this.ctx.setTransform(finalScale, 0, 0, finalScale, 0, 0);

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
