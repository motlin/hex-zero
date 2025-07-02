import {Capacitor} from '@capacitor/core';

/**
 * 🚀 Mobile performance optimizer for canvas-based games
 * Provides platform-specific optimizations for iOS and Android
 */
export class MobilePerformanceOptimizer {
	private static instance: MobilePerformanceOptimizer | undefined;
	// 60 FPS target
	private readonly frameSkipThreshold: number = 16.67;
	private lastFrameTime: number = 0;
	private frameCount: number = 0;
	// Update FPS every second
	private readonly fpsUpdateInterval: number = 1000;
	private lastFpsUpdate: number = 0;
	private currentFps: number = 60;
	private isLowPerformanceMode: boolean = false;
	private readonly platform: 'ios' | 'android' | 'web';
	private readonly devicePixelRatio: number;
	private reducedQualityMode: boolean = false;
	private renderingOptimizations: {
		shadowsEnabled: boolean;
		antialiasEnabled: boolean;
		pixelPerfect: boolean;
		layerCompositing: boolean;
	};

	private constructor() {
		this.platform = this.detectPlatform();
		this.devicePixelRatio = this.getOptimalPixelRatio();
		this.renderingOptimizations = {
			shadowsEnabled: true,
			antialiasEnabled: true,
			pixelPerfect: true,
			layerCompositing: true,
		};

		this.initializePlatformOptimizations();
	}

	static getInstance(): MobilePerformanceOptimizer {
		MobilePerformanceOptimizer.instance ??= new MobilePerformanceOptimizer();
		return MobilePerformanceOptimizer.instance;
	}

	private detectPlatform(): 'ios' | 'android' | 'web' {
		if (!Capacitor.isNativePlatform()) {
			return 'web';
		}
		const platform = Capacitor.getPlatform();
		return platform === 'ios' || platform === 'android' ? platform : 'web';
	}

	private getOptimalPixelRatio(): number {
		const baseRatio = window.devicePixelRatio || 1;

		// Cap pixel ratio for performance on mobile
		if (this.platform === 'android') {
			// Android devices have more varied performance
			return Math.min(baseRatio, 2);
		} else if (this.platform === 'ios') {
			// iOS devices generally handle higher ratios better
			return Math.min(baseRatio, 3);
		}

		return baseRatio;
	}

	private initializePlatformOptimizations(): void {
		if (this.platform === 'ios') {
			this.initializeIOSOptimizations();
		} else if (this.platform === 'android') {
			this.initializeAndroidOptimizations();
		}
	}

	private initializeIOSOptimizations(): void {
		// iOS-specific WebKit optimizations
		const style = document.createElement('style');
		style.textContent = `
            canvas {
                -webkit-transform: translateZ(0);
                -webkit-backface-visibility: hidden;
                -webkit-perspective: 1000;
                will-change: transform;
            }
        `;
		document.head.appendChild(style);
	}

	private initializeAndroidOptimizations(): void {
		// Android-specific optimizations
		const style = document.createElement('style');
		style.textContent = `
            canvas {
                transform: translateZ(0);
                backface-visibility: hidden;
                will-change: transform, contents;
            }
        `;
		document.head.appendChild(style);

		// Reduce quality on lower-end Android devices
		this.detectAndroidPerformanceTier();
	}

	private detectAndroidPerformanceTier(): void {
		// Simple heuristic based on available memory and cores
		const deviceMemory: unknown = Reflect.get(navigator, 'deviceMemory');
		const memory = typeof deviceMemory === 'number' ? deviceMemory : 4;
		const cores = navigator.hardwareConcurrency || 4;

		if (memory <= 2 || cores <= 2) {
			this.enableLowPerformanceMode();
		}
	}

	enableLowPerformanceMode(): void {
		this.isLowPerformanceMode = true;
		this.renderingOptimizations = {
			shadowsEnabled: false,
			antialiasEnabled: false,
			pixelPerfect: false,
			layerCompositing: false,
		};
		this.reducedQualityMode = true;
	}

	optimizeCanvasContext(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D): void {
		// Platform-specific context optimizations
		if (this.platform === 'ios') {
			// iOS benefits from these hints
			ctx.imageSmoothingEnabled = !this.reducedQualityMode;
			Reflect.set(ctx, 'webkitImageSmoothingEnabled', !this.reducedQualityMode);
		} else if (this.platform === 'android') {
			// Android optimization
			// Better performance
			ctx.imageSmoothingEnabled = false;
			if (this.isLowPerformanceMode) {
				ctx.globalCompositeOperation = 'source-over';
			}
		}

		// Common optimizations
		if (this.reducedQualityMode) {
			ctx.imageSmoothingQuality = 'low';
		}
	}

	shouldSkipFrame(currentTime: number): boolean {
		if (!this.isLowPerformanceMode) {
			return false;
		}

		// Skip frames if we're running too slow
		const delta = currentTime - this.lastFrameTime;
		if (delta < this.frameSkipThreshold * 0.5) {
			// Too fast, skip frame
			return true;
		}

		return false;
	}

	updateFrameMetrics(currentTime: number): void {
		this.frameCount++;

		if (currentTime - this.lastFpsUpdate > this.fpsUpdateInterval) {
			this.currentFps = (this.frameCount * 1000) / (currentTime - this.lastFpsUpdate);
			this.frameCount = 0;
			this.lastFpsUpdate = currentTime;

			// Auto-adjust quality based on FPS
			if (this.currentFps < 30 && !this.reducedQualityMode) {
				this.enableReducedQualityMode();
			} else if (this.currentFps > 50 && this.reducedQualityMode) {
				this.disableReducedQualityMode();
			}
		}

		this.lastFrameTime = currentTime;
	}

	private enableReducedQualityMode(): void {
		this.reducedQualityMode = true;
		// Silently enable reduced quality mode
	}

	private disableReducedQualityMode(): void {
		this.reducedQualityMode = false;
		// Silently disable reduced quality mode
	}

	getOptimalCanvasSize(
		requestedWidth: number,
		requestedHeight: number,
	): {width: number; height: number; scale: number} {
		let scale = this.devicePixelRatio;

		if (this.reducedQualityMode) {
			scale = Math.min(scale, 1.5);
		}

		// Cap canvas size for performance
		const maxDimension = this.platform === 'ios' ? 4096 : 2048;
		const width = Math.min(requestedWidth * scale, maxDimension);
		const height = Math.min(requestedHeight * scale, maxDimension);

		return {
			width: Math.floor(width),
			height: Math.floor(height),
			scale: Math.min(width / requestedWidth, height / requestedHeight),
		};
	}

	createOffscreenCanvas(width: number, height: number): OffscreenCanvas | HTMLCanvasElement {
		// Use OffscreenCanvas if available (better performance)
		if (typeof OffscreenCanvas !== 'undefined' && this.platform !== 'ios') {
			// iOS has issues with OffscreenCanvas
			return new OffscreenCanvas(width, height);
		}

		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		return canvas;
	}

	optimizeMemoryUsage(): void {
		if (this.platform === 'android') {
			// More aggressive memory management on Android
			const garbageCollect = Reflect.get(window, 'gc');
			if (typeof garbageCollect === 'function') {
				garbageCollect();
			}
		}
	}

	getBatchRenderingEnabled(): boolean {
		// Batch rendering is beneficial on all platforms
		return true;
	}

	getMaxTextureSize(): number {
		// Platform-specific texture size limits
		if (this.platform === 'ios') {
			return 4096;
		} else if (this.platform === 'android') {
			return this.isLowPerformanceMode ? 1024 : 2048;
		}
		return 4096;
	}

	getCurrentFPS(): number {
		return Math.round(this.currentFps);
	}

	getRenderingOptimizations(): typeof MobilePerformanceOptimizer.prototype.renderingOptimizations {
		return {...this.renderingOptimizations};
	}

	getPlatform(): string {
		return this.platform;
	}

	isReducedQualityMode(): boolean {
		return this.reducedQualityMode;
	}
}
