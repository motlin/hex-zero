import {App} from '@capacitor/app';
import {Capacitor} from '@capacitor/core';
import {HapticFeedback} from './haptic-feedback';

export interface GestureConflictZone {
	area: 'top' | 'bottom' | 'left' | 'right';
	size: number;
	action: 'avoid' | 'adjust' | 'monitor';
}

export interface PlatformGestureConfig {
	backButtonHandler?: () => boolean;
	edgeSwipeThreshold: number;
	systemGestureSafeZones: GestureConflictZone[];
	multiTouchEnabled: boolean;
}

/**
 * 🎮 Handles platform-specific gestures and interactions
 * Ensures game gestures don't conflict with system gestures
 */
export class PlatformGestureHandler {
	private static instance: PlatformGestureHandler;
	private config: PlatformGestureConfig;
	private edgeSwipeMonitor: EdgeSwipeMonitor;
	private multiTouchValidator: MultiTouchValidator;
	private isIOS: boolean;
	private isAndroid: boolean;
	private backButtonListenerRegistered = false;

	private constructor() {
		this.isIOS = Capacitor.getPlatform() === 'ios';
		this.isAndroid = Capacitor.getPlatform() === 'android';

		this.config = this.getDefaultConfig();
		this.edgeSwipeMonitor = new EdgeSwipeMonitor(this.config.edgeSwipeThreshold);
		this.multiTouchValidator = new MultiTouchValidator();
	}

	static getInstance(): PlatformGestureHandler {
		if (!PlatformGestureHandler.instance) {
			PlatformGestureHandler.instance = new PlatformGestureHandler();
		}
		return PlatformGestureHandler.instance;
	}

	async initialize(): Promise<void> {
		// Set up platform-specific handlers
		if (this.isAndroid) {
			await this.setupAndroidGestures();
		} else if (this.isIOS) {
			await this.setupIOSGestures();
		}

		// Set up edge swipe monitoring
		this.setupEdgeSwipeMonitoring();

		// Set up multi-touch validation
		this.setupMultiTouchValidation();
	}

	private getDefaultConfig(): PlatformGestureConfig {
		const baseConfig: PlatformGestureConfig = {
			// pixels from edge
			edgeSwipeThreshold: 20,
			systemGestureSafeZones: [],
			multiTouchEnabled: true,
		};

		if (this.isIOS) {
			// iOS-specific safe zones
			baseConfig.systemGestureSafeZones = [
				// Home indicator area
				{area: 'bottom', size: 34, action: 'avoid'},
				// Control center (top right)
				{area: 'top', size: 44, action: 'adjust'},
				// Notification center (top)
				{area: 'top', size: 44, action: 'adjust'},
			];
		} else if (this.isAndroid) {
			// Android-specific safe zones
			baseConfig.systemGestureSafeZones = [
				// Navigation gesture area
				{area: 'bottom', size: 48, action: 'adjust'},
				// Side swipe for back gesture
				{area: 'left', size: 20, action: 'monitor'},
				{area: 'right', size: 20, action: 'monitor'},
			];
		}

		return baseConfig;
	}

	private async setupAndroidGestures(): Promise<void> {
		// Handle Android back button
		if (!this.backButtonListenerRegistered) {
			App.addListener('backButton', ({canGoBack}) => {
				const handled = this.handleBackButton();
				if (!handled && !canGoBack) {
					// If not handled by game and can't go back, exit app
					App.exitApp();
				}
			});
			this.backButtonListenerRegistered = true;
		}

		// Add CSS class for Android gesture handling
		document.body.classList.add('android-gestures');
	}

	private async setupIOSGestures(): Promise<void> {
		// Add CSS class for iOS gesture handling
		document.body.classList.add('ios-gestures');

		// Set up safe area handling
		this.setupIOSSafeAreas();
	}

	private setupIOSSafeAreas(): void {
		// Ensure safe areas are respected
		const meta = document.querySelector('meta[name="viewport"]');
		if (meta) {
			const content = meta.getAttribute('content') || '';
			if (!content.includes('viewport-fit=cover')) {
				meta.setAttribute('content', content + ', viewport-fit=cover');
			}
		}
	}

	private setupEdgeSwipeMonitoring(): void {
		// Monitor edge swipes to detect potential conflicts
		document.addEventListener('touchstart', (e) => {
			this.edgeSwipeMonitor.onTouchStart(e);
		});

		document.addEventListener('touchmove', (e) => {
			const conflict = this.edgeSwipeMonitor.onTouchMove(e);
			if (conflict) {
				this.handleEdgeSwipeConflict(conflict);
			}
		});

		document.addEventListener('touchend', () => {
			this.edgeSwipeMonitor.onTouchEnd();
		});
	}

	private setupMultiTouchValidation(): void {
		if (!this.config.multiTouchEnabled) {
			return;
		}

		document.addEventListener('touchstart', (e) => {
			this.multiTouchValidator.onTouchStart(e);
		});

		document.addEventListener('touchend', (e) => {
			this.multiTouchValidator.onTouchEnd(e);
		});
	}

	private handleBackButton(): boolean {
		// Check if any modals are open
		const modals = document.querySelectorAll('.modal:not(.hidden)');
		if (modals.length > 0) {
			const lastModal = modals[modals.length - 1];
			if (lastModal) {
				lastModal.classList.add('hidden');
			}
			HapticFeedback.lightTap();
			return true;
		}

		// Check if in game screen
		const gameScreen = document.getElementById('gameScreen');
		const difficultyScreen = document.getElementById('difficultyScreen');

		if (gameScreen && !gameScreen.classList.contains('hidden')) {
			gameScreen.classList.add('hidden');
			difficultyScreen?.classList.remove('hidden');
			HapticFeedback.lightTap();
			return true;
		}

		return false;
	}

	private handleEdgeSwipeConflict(conflict: EdgeSwipeConflict): void {
		// Log conflict for debugging (disable for production)
		// eslint-disable-next-line no-console
		console.log('Edge swipe conflict detected:', conflict);

		// Provide visual feedback if needed
		if (conflict.severity === 'high') {
			// Could show a subtle indicator that the gesture was intercepted
			this.showEdgeSwipeIndicator(conflict.edge);
		}
	}

	private showEdgeSwipeIndicator(edge: string): void {
		const indicator = document.createElement('div');
		indicator.className = `edge-swipe-indicator edge-${edge}`;
		document.body.appendChild(indicator);

		setTimeout(() => {
			indicator.remove();
		}, 500);
	}

	// Public API for game integration

	registerBackButtonHandler(handler: () => boolean): void {
		if (this.isAndroid) {
			this.config.backButtonHandler = handler;
		}
	}

	isInSystemGestureZone(x: number, y: number): boolean {
		const viewport = {
			width: window.innerWidth,
			height: window.innerHeight,
		};

		for (const zone of this.config.systemGestureSafeZones) {
			let inZone = false;

			switch (zone.area) {
				case 'top':
					inZone = y < zone.size;
					break;
				case 'bottom':
					inZone = y > viewport.height - zone.size;
					break;
				case 'left':
					inZone = x < zone.size;
					break;
				case 'right':
					inZone = x > viewport.width - zone.size;
					break;
			}

			if (inZone) {
				return zone.action === 'avoid';
			}
		}

		return false;
	}

	adjustGestureForPlatform(gesture: TouchGesture): TouchGesture {
		// Adjust gesture parameters based on platform
		if (this.isIOS) {
			// iOS adjustments
			if (gesture.type === 'swipe' && gesture.startY && gesture.startY < 44) {
				// Reduce sensitivity near status bar
				gesture.threshold *= 1.5;
			}
		} else if (this.isAndroid) {
			// Android adjustments
			if (gesture.type === 'swipe' && gesture.startX && gesture.startX < 20) {
				// Reduce sensitivity near back gesture area
				gesture.threshold *= 1.5;
			}
		}

		return gesture;
	}

	getMultiTouchSupport(): MultiTouchSupport {
		return {
			enabled: this.config.multiTouchEnabled,
			// iOS supports more simultaneous touches
			maxTouches: this.isIOS ? 10 : 5,
			validator: this.multiTouchValidator,
		};
	}
}

/**
 * 📱 Monitors edge swipes to detect system gesture conflicts
 */
class EdgeSwipeMonitor {
	private threshold: number;
	private activeTouch: Touch | null = null;
	private startX = 0;
	private startY = 0;
	private startTime = 0;

	constructor(threshold: number) {
		this.threshold = threshold;
	}

	onTouchStart(e: TouchEvent): void {
		if (e.touches.length === 1) {
			const firstTouch = e.touches[0];
			if (firstTouch) {
				this.activeTouch = firstTouch;
				this.startX = this.activeTouch.clientX;
				this.startY = this.activeTouch.clientY;
				this.startTime = Date.now();
			}
		}
	}

	onTouchMove(e: TouchEvent): EdgeSwipeConflict | null {
		if (!this.activeTouch || e.touches.length !== 1) {
			return null;
		}

		const touch = e.touches[0];
		if (!touch) {
			return null;
		}
		const deltaX = touch.clientX - this.startX;
		const deltaY = touch.clientY - this.startY;
		const deltaTime = Date.now() - this.startTime;

		// Check for edge swipe
		if (Math.abs(deltaX) > Math.abs(deltaY) && deltaTime < 500) {
			// Horizontal swipe
			if (this.startX < this.threshold && deltaX > 50) {
				return {
					edge: 'left',
					type: 'swipe-in',
					severity: 'high',
				};
			} else if (this.startX > window.innerWidth - this.threshold && deltaX < -50) {
				return {
					edge: 'right',
					type: 'swipe-in',
					severity: 'high',
				};
			}
		}

		return null;
	}

	onTouchEnd(): void {
		this.activeTouch = null;
	}
}

/**
 * ✌️ Validates multi-touch gestures
 */
class MultiTouchValidator {
	private activeTouches: Map<number, TouchInfo> = new Map();
	private recognizedGesture: MultiTouchGesture | null = null;

	onTouchStart(e: TouchEvent): void {
		for (let i = 0; i < e.touches.length; i++) {
			const touch = e.touches[i];
			if (touch) {
				this.activeTouches.set(touch.identifier, {
					startX: touch.clientX,
					startY: touch.clientY,
					currentX: touch.clientX,
					currentY: touch.clientY,
					startTime: Date.now(),
				});
			}
		}

		if (e.touches.length === 2) {
			this.detectTwoFingerGesture();
		}
	}

	onTouchEnd(e: TouchEvent): void {
		for (let i = 0; i < e.changedTouches.length; i++) {
			const touch = e.changedTouches[i];
			if (touch) {
				this.activeTouches.delete(touch.identifier);
			}
		}

		if (this.activeTouches.size === 0) {
			this.recognizedGesture = null;
		}
	}

	private detectTwoFingerGesture(): void {
		if (this.activeTouches.size !== 2) {
			return;
		}

		const touches = Array.from(this.activeTouches.values());
		if (touches.length < 2 || !touches[0] || !touches[1]) {
			return;
		}
		const distance = this.getDistance(
			touches[0].currentX,
			touches[0].currentY,
			touches[1].currentX,
			touches[1].currentY,
		);

		// Store initial distance for pinch detection
		if (!this.recognizedGesture) {
			this.recognizedGesture = {
				type: 'pinch',
				initialDistance: distance,
				currentDistance: distance,
				scale: 1,
			};
		}
	}

	private getDistance(x1: number, y1: number, x2: number, y2: number): number {
		const dx = x2 - x1;
		const dy = y2 - y1;
		return Math.sqrt(dx * dx + dy * dy);
	}

	getCurrentGesture(): MultiTouchGesture | null {
		return this.recognizedGesture;
	}

	isValidMultiTouch(): boolean {
		// Validate that multi-touch is intentional and not accidental
		if (this.activeTouches.size < 2) {
			return false;
		}

		const touches = Array.from(this.activeTouches.values());
		if (touches.length < 2 || !touches[0] || !touches[1]) {
			return false;
		}
		const timeDiff = Math.abs(touches[0].startTime - touches[1].startTime);

		// Touches should start within 100ms of each other
		return timeDiff < 100;
	}
}

// Type definitions
interface TouchGesture {
	type: 'tap' | 'swipe' | 'drag' | 'pinch';
	startX?: number;
	startY?: number;
	threshold: number;
}

interface EdgeSwipeConflict {
	edge: 'left' | 'right' | 'top' | 'bottom';
	type: 'swipe-in' | 'swipe-out';
	severity: 'low' | 'medium' | 'high';
}

interface TouchInfo {
	startX: number;
	startY: number;
	currentX: number;
	currentY: number;
	startTime: number;
}

interface MultiTouchGesture {
	type: 'pinch' | 'rotate' | 'two-finger-swipe';
	initialDistance?: number;
	currentDistance?: number;
	scale?: number;
	rotation?: number;
}

interface MultiTouchSupport {
	enabled: boolean;
	maxTouches: number;
	validator: MultiTouchValidator;
}
