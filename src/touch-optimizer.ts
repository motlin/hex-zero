// Touch optimizer for enhanced mobile interactions

interface TouchState {
	identifier: number;
	startX: number;
	startY: number;
	startTime: number;
	currentX: number;
	currentY: number;
	isDragging: boolean;
	element?: HTMLElement;
}

export class TouchOptimizer {
	// Threshold for tap detection in pixels
	private static readonly TAP_THRESHOLD = 10;
	// Maximum time for tap detection in milliseconds
	private static readonly TAP_TIME_THRESHOLD = 300;
	// Minimum distance before drag starts in pixels
	private static readonly DRAG_THRESHOLD = 5;
	// Maximum time between taps for double tap in milliseconds
	private static readonly DOUBLE_TAP_TIME = 300;
	// Time to trigger hold gesture in milliseconds
	private static readonly HOLD_TIME = 500;

	private touches = new Map<number, TouchState>();
	private lastTapTime = 0;
	private lastTapLocation: {x: number; y: number} | null = null;
	private holdTimer: number | null = null;

	constructor(
		private onTap: (x: number, y: number) => void,
		private onDoubleTap: (x: number, y: number) => void,
		private onDragStart: (x: number, y: number, element?: HTMLElement) => void,
		private onDragMove: (x: number, y: number) => void,
		private onDragEnd: (x: number, y: number) => void,
		private onPinchStart?: (distance: number, centerX: number, centerY: number) => void,
		private onPinchMove?: (scale: number, centerX: number, centerY: number) => void,
		private onPinchEnd?: () => void,
		private onHold?: (x: number, y: number) => void,
	) {}

	handleTouchStart(event: TouchEvent, element?: HTMLElement): void {
		// Process each new touch
		for (let i = 0; i < event.changedTouches.length; i++) {
			const touch = event.changedTouches[i];
			if (!touch) continue;
			const touchState: TouchState = {
				identifier: touch.identifier,
				startX: touch.clientX,
				startY: touch.clientY,
				startTime: Date.now(),
				currentX: touch.clientX,
				currentY: touch.clientY,
				isDragging: false,
				...(element && {element}),
			};

			this.touches.set(touch.identifier, touchState);
		}

		// Handle pinch gesture start
		if (this.touches.size === 2 && this.onPinchStart) {
			const touchArray = Array.from(this.touches.values());
			const touch0 = touchArray[0];
			const touch1 = touchArray[1];
			if (touch0 && touch1) {
				const distance = this.getDistance(touch0.currentX, touch0.currentY, touch1.currentX, touch1.currentY);
				const centerX = (touch0.currentX + touch1.currentX) / 2;
				const centerY = (touch0.currentY + touch1.currentY) / 2;
				this.onPinchStart(distance, centerX, centerY);
			}
		}

		// Start hold timer for single touch
		if (this.touches.size === 1 && this.onHold) {
			const touch = Array.from(this.touches.values())[0];
			if (touch) {
				this.holdTimer = window.setTimeout(() => {
					if (this.touches.has(touch.identifier) && !touch.isDragging) {
						this.onHold!(touch.currentX, touch.currentY);
					}
				}, TouchOptimizer.HOLD_TIME);
			}
		}
	}

	handleTouchMove(event: TouchEvent): void {
		// Update touch positions
		for (let i = 0; i < event.changedTouches.length; i++) {
			const touch = event.changedTouches[i];
			if (!touch) continue;
			const touchState = this.touches.get(touch.identifier);

			if (touchState) {
				touchState.currentX = touch.clientX;
				touchState.currentY = touch.clientY;

				// Check if this should be considered a drag
				const distance = this.getDistance(
					touchState.startX,
					touchState.startY,
					touchState.currentX,
					touchState.currentY,
				);

				if (distance > TouchOptimizer.DRAG_THRESHOLD && !touchState.isDragging) {
					touchState.isDragging = true;
					// Cancel hold timer on drag
					if (this.holdTimer) {
						clearTimeout(this.holdTimer);
						this.holdTimer = null;
					}
					this.onDragStart(touchState.currentX, touchState.currentY, touchState.element);
				}

				if (touchState.isDragging) {
					this.onDragMove(touchState.currentX, touchState.currentY);
				}
			}
		}

		// Handle pinch gesture
		if (this.touches.size === 2 && this.onPinchMove) {
			const touchArray = Array.from(this.touches.values());
			const touch0 = touchArray[0];
			const touch1 = touchArray[1];
			if (touch0 && touch1) {
				const newDistance = this.getDistance(
					touch0.currentX,
					touch0.currentY,
					touch1.currentX,
					touch1.currentY,
				);
				const centerX = (touch0.currentX + touch1.currentX) / 2;
				const centerY = (touch0.currentY + touch1.currentY) / 2;

				// Calculate scale based on initial pinch distance
				const initialDistance = this.getDistance(touch0.startX, touch0.startY, touch1.startX, touch1.startY);
				const scale = newDistance / initialDistance;

				this.onPinchMove(scale, centerX, centerY);
			}
		}
	}

	handleTouchEnd(event: TouchEvent): void {
		const now = Date.now();

		// Process ended touches
		for (let i = 0; i < event.changedTouches.length; i++) {
			const touch = event.changedTouches[i];
			if (!touch) continue;
			const touchState = this.touches.get(touch.identifier);

			if (touchState) {
				const distance = this.getDistance(
					touchState.startX,
					touchState.startY,
					touchState.currentX,
					touchState.currentY,
				);
				const duration = now - touchState.startTime;

				// Handle tap vs drag
				if (
					!touchState.isDragging &&
					distance < TouchOptimizer.TAP_THRESHOLD &&
					duration < TouchOptimizer.TAP_TIME_THRESHOLD
				) {
					// Check for double tap
					if (this.lastTapLocation && now - this.lastTapTime < TouchOptimizer.DOUBLE_TAP_TIME) {
						const tapDistance = this.getDistance(
							this.lastTapLocation.x,
							this.lastTapLocation.y,
							touchState.currentX,
							touchState.currentY,
						);

						if (tapDistance < TouchOptimizer.TAP_THRESHOLD * 2) {
							this.onDoubleTap(touchState.currentX, touchState.currentY);
							this.lastTapTime = 0;
							this.lastTapLocation = null;
						}
					} else {
						// Single tap
						this.onTap(touchState.currentX, touchState.currentY);
						this.lastTapTime = now;
						this.lastTapLocation = {
							x: touchState.currentX,
							y: touchState.currentY,
						};
					}
				} else if (touchState.isDragging) {
					this.onDragEnd(touchState.currentX, touchState.currentY);
				}

				this.touches.delete(touch.identifier);
			}
		}

		// Cancel hold timer
		if (this.holdTimer && this.touches.size === 0) {
			clearTimeout(this.holdTimer);
			this.holdTimer = null;
		}

		// Handle pinch end
		if (this.touches.size < 2 && this.onPinchEnd) {
			this.onPinchEnd();
		}
	}

	handleTouchCancel(event: TouchEvent): void {
		// Clean up cancelled touches
		for (let i = 0; i < event.changedTouches.length; i++) {
			const touch = event.changedTouches[i];
			if (!touch) continue;
			const touchState = this.touches.get(touch.identifier);

			if (touchState && touchState.isDragging) {
				this.onDragEnd(touchState.currentX, touchState.currentY);
			}

			this.touches.delete(touch.identifier);
		}

		// Cancel hold timer
		if (this.holdTimer) {
			clearTimeout(this.holdTimer);
			this.holdTimer = null;
		}

		// Handle pinch end
		if (this.touches.size < 2 && this.onPinchEnd) {
			this.onPinchEnd();
		}
	}

	private getDistance(x1: number, y1: number, x2: number, y2: number): number {
		const dx = x2 - x1;
		const dy = y2 - y1;
		return Math.sqrt(dx * dx + dy * dy);
	}

	isCurrentlyDragging(): boolean {
		return Array.from(this.touches.values()).some((touch) => touch.isDragging);
	}

	getCurrentTouchCount(): number {
		return this.touches.size;
	}
}

// Touch feedback helper
export function addTouchFeedback(
	element: HTMLElement,
	options?: {
		scale?: number;
		duration?: number;
		activeClass?: string;
	},
): void {
	const {scale = 0.95, duration = 150, activeClass = 'touch-active'} = options || {};

	let isActive = false;

	const activate = () => {
		if (isActive) return;
		isActive = true;
		element.classList.add(activeClass);
		element.style.transform = `scale(${scale})`;
		element.style.transition = `transform ${duration}ms ease-out`;
	};

	const deactivate = () => {
		if (!isActive) return;
		isActive = false;
		element.classList.remove(activeClass);
		element.style.transform = '';
		setTimeout(() => {
			if (!isActive) {
				element.style.transition = '';
			}
		}, duration);
	};

	element.addEventListener('touchstart', activate, {passive: true});
	element.addEventListener('touchend', deactivate, {passive: true});
	element.addEventListener('touchcancel', deactivate, {passive: true});
	element.addEventListener('mousedown', activate);
	element.addEventListener('mouseup', deactivate);
	element.addEventListener('mouseleave', deactivate);
}

// Improved touch target helper
export function ensureTouchTarget(element: HTMLElement, minSize: number = 44): void {
	const rect = element.getBoundingClientRect();

	if (rect.width < minSize || rect.height < minSize) {
		// Create invisible touch target overlay
		const touchTarget = document.createElement('div');
		touchTarget.className = 'touch-target-overlay';
		touchTarget.style.position = 'absolute';
		touchTarget.style.minWidth = `${minSize}px`;
		touchTarget.style.minHeight = `${minSize}px`;
		touchTarget.style.transform = 'translate(-50%, -50%)';
		touchTarget.style.top = '50%';
		touchTarget.style.left = '50%';
		touchTarget.style.zIndex = '1';

		// Make parent relative if not already positioned
		const position = window.getComputedStyle(element).position;
		if (position === 'static') {
			element.style.position = 'relative';
		}

		// Forward events to original element
		touchTarget.addEventListener('click', (e) => {
			e.stopPropagation();
			element.click();
		});

		element.appendChild(touchTarget);
	}
}
