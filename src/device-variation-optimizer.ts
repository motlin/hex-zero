import {Device} from '@capacitor/device';
import {MobilePerformanceOptimizer} from './performance/MobilePerformanceOptimizer';

export interface DeviceProfile {
	deviceType: 'phone' | 'tablet' | 'phablet';
	screenSize: 'small' | 'medium' | 'large' | 'xlarge';
	performance: 'low' | 'medium' | 'high';
	hexSize: number;
	piecesPerPage: number;
	canvasScale: number;
	uiScale: number;
}

export interface DeviceInfo {
	model: string;
	platform: 'ios' | 'android' | 'web';
	osVersion: string;
	screenWidth: number;
	screenHeight: number;
	pixelRatio: number;
	isVirtual: boolean;
}

/**
 * 📱 Optimizes game experience for different device variations
 */
export class DeviceVariationOptimizer {
	private static instance: DeviceVariationOptimizer;
	private deviceInfo: DeviceInfo | null = null;
	private deviceProfile: DeviceProfile | null = null;
	private performanceOptimizer: MobilePerformanceOptimizer;

	// Known device configurations for optimization
	private readonly deviceConfigs: Map<string, Partial<DeviceProfile>> = new Map([
		// iOS Devices
		['iPhone SE', {hexSize: 25, piecesPerPage: 3, canvasScale: 1.0}],
		['iPhone SE (2nd generation)', {hexSize: 25, piecesPerPage: 3, canvasScale: 1.0}],
		['iPhone SE (3rd generation)', {hexSize: 25, piecesPerPage: 3, canvasScale: 1.0}],
		['iPhone 8', {hexSize: 28, piecesPerPage: 3, canvasScale: 1.0}],
		['iPhone 8 Plus', {hexSize: 30, piecesPerPage: 4, canvasScale: 1.0}],
		['iPhone X', {hexSize: 28, piecesPerPage: 3, canvasScale: 1.2}],
		['iPhone XR', {hexSize: 30, piecesPerPage: 3, canvasScale: 1.0}],
		['iPhone 11', {hexSize: 30, piecesPerPage: 3, canvasScale: 1.2}],
		['iPhone 12', {hexSize: 30, piecesPerPage: 3, canvasScale: 1.5}],
		['iPhone 12 mini', {hexSize: 26, piecesPerPage: 3, canvasScale: 1.2}],
		['iPhone 12 Pro', {hexSize: 30, piecesPerPage: 3, canvasScale: 1.5}],
		['iPhone 12 Pro Max', {hexSize: 32, piecesPerPage: 4, canvasScale: 1.5}],
		['iPhone 13', {hexSize: 30, piecesPerPage: 3, canvasScale: 1.5}],
		['iPhone 13 mini', {hexSize: 26, piecesPerPage: 3, canvasScale: 1.2}],
		['iPhone 13 Pro', {hexSize: 30, piecesPerPage: 3, canvasScale: 1.5}],
		['iPhone 13 Pro Max', {hexSize: 32, piecesPerPage: 4, canvasScale: 1.5}],
		['iPhone 14', {hexSize: 30, piecesPerPage: 3, canvasScale: 1.5}],
		['iPhone 14 Plus', {hexSize: 32, piecesPerPage: 4, canvasScale: 1.5}],
		['iPhone 14 Pro', {hexSize: 30, piecesPerPage: 3, canvasScale: 1.5}],
		['iPhone 14 Pro Max', {hexSize: 32, piecesPerPage: 4, canvasScale: 1.5}],
		['iPhone 15', {hexSize: 30, piecesPerPage: 3, canvasScale: 1.5}],
		['iPhone 15 Plus', {hexSize: 32, piecesPerPage: 4, canvasScale: 1.5}],
		['iPhone 15 Pro', {hexSize: 30, piecesPerPage: 3, canvasScale: 1.5}],
		['iPhone 15 Pro Max', {hexSize: 32, piecesPerPage: 4, canvasScale: 1.5}],

		// iPads
		['iPad', {hexSize: 40, piecesPerPage: 5, canvasScale: 1.5}],
		['iPad Air', {hexSize: 42, piecesPerPage: 6, canvasScale: 1.5}],
		['iPad Pro', {hexSize: 45, piecesPerPage: 7, canvasScale: 2.0}],
		['iPad mini', {hexSize: 35, piecesPerPage: 4, canvasScale: 1.5}],

		// Android Phones (common models)
		['Pixel 3a', {hexSize: 28, piecesPerPage: 3, canvasScale: 1.0, performance: 'medium'}],
		['Pixel 4', {hexSize: 30, piecesPerPage: 3, canvasScale: 1.2, performance: 'high'}],
		['Pixel 5', {hexSize: 30, piecesPerPage: 3, canvasScale: 1.2, performance: 'high'}],
		['Pixel 6', {hexSize: 30, piecesPerPage: 3, canvasScale: 1.5, performance: 'high'}],
		['Pixel 7', {hexSize: 30, piecesPerPage: 3, canvasScale: 1.5, performance: 'high'}],
		['Galaxy S20', {hexSize: 30, piecesPerPage: 3, canvasScale: 1.5, performance: 'high'}],
		['Galaxy S21', {hexSize: 30, piecesPerPage: 3, canvasScale: 1.5, performance: 'high'}],
		['Galaxy S22', {hexSize: 30, piecesPerPage: 3, canvasScale: 1.5, performance: 'high'}],
		['Galaxy S23', {hexSize: 30, piecesPerPage: 3, canvasScale: 1.5, performance: 'high'}],
		['Galaxy A52', {hexSize: 28, piecesPerPage: 3, canvasScale: 1.0, performance: 'medium'}],
		['OnePlus 9', {hexSize: 30, piecesPerPage: 3, canvasScale: 1.5, performance: 'high'}],

		// Android Tablets
		['Galaxy Tab S7', {hexSize: 42, piecesPerPage: 6, canvasScale: 1.5, performance: 'high'}],
		['Galaxy Tab S8', {hexSize: 44, piecesPerPage: 6, canvasScale: 1.5, performance: 'high'}],
	]);

	private constructor() {
		this.performanceOptimizer = MobilePerformanceOptimizer.getInstance();
	}

	static getInstance(): DeviceVariationOptimizer {
		if (!DeviceVariationOptimizer.instance) {
			DeviceVariationOptimizer.instance = new DeviceVariationOptimizer();
		}
		return DeviceVariationOptimizer.instance;
	}

	async initialize(): Promise<void> {
		try {
			const info = await Device.getInfo();

			this.deviceInfo = {
				model: info.model || 'Unknown',
				platform: info.platform as 'ios' | 'android' | 'web',
				osVersion: info.osVersion || '0',
				screenWidth: window.innerWidth,
				screenHeight: window.innerHeight,
				pixelRatio: window.devicePixelRatio || 1,
				isVirtual: info.isVirtual || false,
			};

			this.deviceProfile = this.determineDeviceProfile();
			this.applyDeviceOptimizations();
		} catch (_error) {
			// Fallback for web or errors
			this.deviceInfo = {
				model: 'Web Browser',
				platform: 'web',
				osVersion: '0',
				screenWidth: window.innerWidth,
				screenHeight: window.innerHeight,
				pixelRatio: window.devicePixelRatio || 1,
				isVirtual: false,
			};

			this.deviceProfile = this.determineDeviceProfile();
		}
	}

	private determineDeviceProfile(): DeviceProfile {
		if (!this.deviceInfo) {
			return this.getDefaultProfile();
		}

		const {screenWidth, screenHeight, pixelRatio, model} = this.deviceInfo;
		const screenSize = Math.min(screenWidth, screenHeight);
		const diagonal = Math.sqrt(screenWidth * screenWidth + screenHeight * screenHeight);

		// Check for known device configuration
		const knownConfig = this.deviceConfigs.get(model);

		// Determine device type
		let deviceType: 'phone' | 'tablet' | 'phablet';
		if (diagonal < 800) {
			deviceType = 'phone';
		} else if (diagonal < 1200) {
			deviceType = 'phablet';
		} else {
			deviceType = 'tablet';
		}

		// Determine screen size category
		let screenSizeCategory: 'small' | 'medium' | 'large' | 'xlarge';
		if (screenSize < 360) {
			screenSizeCategory = 'small';
		} else if (screenSize < 414) {
			screenSizeCategory = 'medium';
		} else if (screenSize < 768) {
			screenSizeCategory = 'large';
		} else {
			screenSizeCategory = 'xlarge';
		}

		// Determine performance tier
		const performance = knownConfig?.performance || this.detectPerformanceTier();

		// Calculate optimal hex size
		const baseHexSize = knownConfig?.hexSize || this.calculateOptimalHexSize(screenSize, deviceType);

		// Calculate pieces per page
		const piecesPerPage = knownConfig?.piecesPerPage || this.calculatePiecesPerPage(screenSize, deviceType);

		// Calculate canvas scale
		const canvasScale = knownConfig?.canvasScale || this.calculateCanvasScale(pixelRatio, performance);

		// UI scale based on screen density
		const uiScale = this.calculateUIScale(pixelRatio, screenSize);

		return {
			deviceType,
			screenSize: screenSizeCategory,
			performance,
			hexSize: baseHexSize,
			piecesPerPage,
			canvasScale,
			uiScale,
		};
	}

	private detectPerformanceTier(): 'low' | 'medium' | 'high' {
		// Use existing performance detection from MobilePerformanceOptimizer
		if (this.performanceOptimizer.isReducedQualityMode()) {
			return 'low';
		}

		// Additional heuristics
		const memory = (navigator as unknown as {deviceMemory?: number}).deviceMemory || 4;
		const cores = navigator.hardwareConcurrency || 4;

		if (memory >= 8 && cores >= 8) {
			return 'high';
		} else if (memory >= 4 && cores >= 4) {
			return 'medium';
		} else {
			return 'low';
		}
	}

	private calculateOptimalHexSize(screenSize: number, deviceType: 'phone' | 'tablet' | 'phablet'): number {
		// Base hex sizes for different device types
		const baseSizes = {
			phone: {small: 24, medium: 28, large: 30},
			phablet: {small: 30, medium: 32, large: 35},
			tablet: {small: 35, medium: 40, large: 45},
		};

		let sizeCategory: 'small' | 'medium' | 'large';
		if (screenSize < 360) {
			sizeCategory = 'small';
		} else if (screenSize < 414) {
			sizeCategory = 'medium';
		} else {
			sizeCategory = 'large';
		}

		return baseSizes[deviceType][sizeCategory];
	}

	private calculatePiecesPerPage(screenSize: number, deviceType: 'phone' | 'tablet' | 'phablet'): number {
		if (deviceType === 'tablet') {
			return screenSize < 1024 ? 5 : 7;
		} else if (deviceType === 'phablet') {
			return 4;
		} else {
			return screenSize < 360 ? 2 : 3;
		}
	}

	private calculateCanvasScale(pixelRatio: number, performance: 'low' | 'medium' | 'high'): number {
		if (performance === 'low') {
			return Math.min(pixelRatio, 1.0);
		} else if (performance === 'medium') {
			return Math.min(pixelRatio, 1.5);
		} else {
			return Math.min(pixelRatio, 2.0);
		}
	}

	private calculateUIScale(pixelRatio: number, screenSize: number): number {
		// Adjust UI scale for readability
		if (pixelRatio >= 3 && screenSize < 400) {
			// Slightly larger UI for high-DPI small screens
			return 1.1;
		} else if (pixelRatio >= 2) {
			return 1.0;
		} else {
			// Slightly smaller UI for low-DPI screens
			return 0.9;
		}
	}

	private getDefaultProfile(): DeviceProfile {
		return {
			deviceType: 'phone',
			screenSize: 'medium',
			performance: 'medium',
			hexSize: 30,
			piecesPerPage: 3,
			canvasScale: 1.0,
			uiScale: 1.0,
		};
	}

	private applyDeviceOptimizations(): void {
		if (!this.deviceProfile) return;

		// Add CSS classes based on device profile
		document.body.classList.add(`device-${this.deviceProfile.deviceType}`);
		document.body.classList.add(`screen-${this.deviceProfile.screenSize}`);
		document.body.classList.add(`performance-${this.deviceProfile.performance}`);

		// Add pixel ratio classes
		if (this.deviceInfo?.pixelRatio) {
			if (this.deviceInfo.pixelRatio >= 3) {
				document.body.classList.add('high-dpi-3x');
			} else if (this.deviceInfo.pixelRatio >= 2) {
				document.body.classList.add('high-dpi-2x');
			}
		}

		// Apply CSS custom properties for dynamic sizing
		const root = document.documentElement;
		root.style.setProperty('--hex-size', `${this.deviceProfile.hexSize}px`);
		root.style.setProperty('--ui-scale', `${this.deviceProfile.uiScale}`);
		root.style.setProperty('--canvas-scale', `${this.deviceProfile.canvasScale}`);

		// Apply performance-specific optimizations
		if (this.deviceProfile.performance === 'low') {
			this.applyLowPerformanceOptimizations();
		}
	}

	private applyLowPerformanceOptimizations(): void {
		// Reduce animation durations
		const style = document.createElement('style');
		style.textContent = `
            * {
                animation-duration: 0.2s !important;
                transition-duration: 0.2s !important;
            }

            .draggable-piece {
                will-change: auto !important;
            }

            canvas {
                image-rendering: pixelated;
                image-rendering: -moz-crisp-edges;
                image-rendering: crisp-edges;
            }
        `;
		document.head.appendChild(style);
	}

	getDeviceProfile(): DeviceProfile | null {
		return this.deviceProfile;
	}

	getDeviceInfo(): DeviceInfo | null {
		return this.deviceInfo;
	}

	getOptimalHexSize(): number {
		return this.deviceProfile?.hexSize || 30;
	}

	getPiecesPerPage(): number {
		return this.deviceProfile?.piecesPerPage || 3;
	}

	getCanvasScale(): number {
		return this.deviceProfile?.canvasScale || 1.0;
	}

	shouldReduceAnimations(): boolean {
		return (
			this.deviceProfile?.performance === 'low' || window.matchMedia('(prefers-reduced-motion: reduce)').matches
		);
	}

	shouldUseBatchRendering(): boolean {
		return this.deviceProfile?.performance !== 'high';
	}

	getMaxCanvasSize(): number {
		if (this.deviceProfile?.performance === 'low') {
			return 1024;
		} else if (this.deviceProfile?.performance === 'medium') {
			return 2048;
		} else {
			return 4096;
		}
	}

	// Responsive helpers
	isSmallScreen(): boolean {
		return this.deviceProfile?.screenSize === 'small';
	}

	isTablet(): boolean {
		return this.deviceProfile?.deviceType === 'tablet';
	}

	isPhone(): boolean {
		return this.deviceProfile?.deviceType === 'phone';
	}

	isPhablet(): boolean {
		return this.deviceProfile?.deviceType === 'phablet';
	}

	isLowPerformance(): boolean {
		return this.deviceProfile?.performance === 'low';
	}
}
