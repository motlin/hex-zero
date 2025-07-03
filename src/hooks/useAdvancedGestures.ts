/**
 * Advanced gesture recognition hook
 * Implements multi-finger gestures, long press piece cycling, and gesture conflict resolution
 * Optimized for touch responsiveness with reduced latency
 */

import {useRef, useCallback} from 'react';
import {Gesture, GestureType, ComposedGesture} from 'react-native-gesture-handler';
import {runOnJS, useSharedValue, withSpring, withTiming, cancelAnimation, runOnUI} from 'react-native-reanimated';

interface AdvancedGestureOptions {
	// Multi-finger navigation
	onTwoFingerSwipeLeft?: () => void;
	onTwoFingerSwipeRight?: () => void;
	onThreeFingerTap?: () => void;

	// Long press piece cycling
	onLongPressCycle?: () => void;
	onLongPressHold?: (progress: number) => void;

	// Gesture priority and conflicts
	enablePanWhileDragging?: boolean;
	swipeThreshold?: number;
	velocityThreshold?: number;

	// Performance options
	gestureDebounceMs?: number;
	useNativeDriver?: boolean;

	// Callbacks
	onGestureStart?: (gestureType: string) => void;
	onGestureEnd?: (gestureType: string) => void;
}

export const useAdvancedGestures = (options: AdvancedGestureOptions = {}) => {
	const {
		onTwoFingerSwipeLeft,
		onTwoFingerSwipeRight,
		onThreeFingerTap,
		onLongPressCycle,
		onLongPressHold,
		// Reserved for future use
		enablePanWhileDragging = false,
		swipeThreshold = 50,
		velocityThreshold = 300,
		// ~60fps
		gestureDebounceMs = 16,
		// Reserved for future use
		useNativeDriver = true,
		onGestureStart,
		onGestureEnd,
	} = options;

	// Mark as intentionally unused for now
	void enablePanWhileDragging;
	void useNativeDriver;

	// Shared values for gesture state
	const activeGesture = useSharedValue<string | null>(null);
	const longPressProgress = useSharedValue(0);
	const isMultiTouch = useSharedValue(false);
	// 0=none, 1=navigation, 2=pan/zoom, 3=drag
	const gesturePriority = useSharedValue(0);
	const lastGestureTime = useSharedValue(0);

	// Refs for gesture state management
	const gestureStateRef = useRef({
		isDragging: false,
		isPanning: false,
		isZooming: false,
	});

	// Gesture priority levels
	const PRIORITY_NONE = 0;
	const PRIORITY_NAVIGATION = 1;
	const PRIORITY_PAN_ZOOM = 2;
	const PRIORITY_DRAG = 3;

	// Helper to check if gesture should be allowed (optimized worklet)
	const canStartGesture = useCallback(
		(gestureType: string, priority: number) => {
			'worklet';

			// Fast priority check
			if (gesturePriority.value > priority) {
				return false;
			}

			// Debounce rapid gesture switches
			const now = Date.now();
			if (now - lastGestureTime.value < gestureDebounceMs) {
				return false;
			}

			// Priority system: drag (3) > zoom (2) > pan (2) > navigation (1)
			if (gestureType === 'drag') {
				return true;
			}

			if (gestureType === 'zoom' || gestureType === 'pan') {
				return gesturePriority.value < PRIORITY_DRAG;
			}

			if (gestureType === 'navigation') {
				return gesturePriority.value < PRIORITY_PAN_ZOOM;
			}

			return true;
		},
		[gestureDebounceMs, gesturePriority, lastGestureTime, PRIORITY_DRAG, PRIORITY_PAN_ZOOM],
	);

	// Two-finger swipe gesture for piece navigation (optimized)
	const twoFingerSwipeGesture = Gesture.Pan()
		.minPointers(2)
		.minDistance(swipeThreshold)
		.shouldCancelWhenOutside(true)
		.hitSlop({horizontal: 20, vertical: 20})
		.onStart(() => {
			'worklet';
			if (canStartGesture('navigation', PRIORITY_NAVIGATION)) {
				isMultiTouch.value = true;
				activeGesture.value = 'twoFingerSwipe';
				gesturePriority.value = PRIORITY_NAVIGATION;
				lastGestureTime.value = Date.now();
				if (onGestureStart) {
					runOnJS(onGestureStart)('twoFingerSwipe');
				}
			}
		})
		.onEnd((event) => {
			'worklet';
			if (activeGesture.value === 'twoFingerSwipe') {
				// Check velocity and distance for swipe detection
				const velocityX = event.velocityX;
				const translationX = event.translationX;

				if (Math.abs(velocityX) > velocityThreshold || Math.abs(translationX) > swipeThreshold) {
					if (velocityX > 0 || translationX > swipeThreshold) {
						if (onTwoFingerSwipeRight) runOnJS(onTwoFingerSwipeRight)();
					} else if (velocityX < 0 || translationX < -swipeThreshold) {
						if (onTwoFingerSwipeLeft) runOnJS(onTwoFingerSwipeLeft)();
					}
				}

				isMultiTouch.value = false;
				activeGesture.value = null;
				gesturePriority.value = PRIORITY_NONE;
				if (onGestureEnd) {
					runOnJS(onGestureEnd)('twoFingerSwipe');
				}
			}
		})
		.onFinalize(() => {
			'worklet';
			if (activeGesture.value === 'twoFingerSwipe') {
				isMultiTouch.value = false;
				activeGesture.value = null;
				gesturePriority.value = PRIORITY_NONE;
			}
		});

	// Three-finger tap for special actions (e.g., show all pieces)
	const threeFingerTapGesture = Gesture.Tap()
		.minPointers(3)
		.numberOfTaps(1)
		.maxDuration(250)
		.onEnd(() => {
			'worklet';
			if (canStartGesture('navigation', PRIORITY_NAVIGATION) && onThreeFingerTap) {
				runOnJS(onThreeFingerTap)();
			}
		});

	// Long press with progress for piece cycling (optimized)
	const longPressCycleGesture = Gesture.LongPress()
		.minDuration(600)
		.shouldCancelWhenOutside(true)
		.onStart(() => {
			'worklet';
			if (canStartGesture('navigation', PRIORITY_NAVIGATION)) {
				activeGesture.value = 'longPressCycle';
				gesturePriority.value = PRIORITY_NAVIGATION;
				lastGestureTime.value = Date.now();

				// Animate progress from 0 to 1 with cycle callback
				const animateProgress = () => {
					'worklet';
					longPressProgress.value = withTiming(1, {duration: 1000}, (finished) => {
						if (finished && activeGesture.value === 'longPressCycle') {
							if (onLongPressCycle) runOnJS(onLongPressCycle)();
							longPressProgress.value = 0;
							// Continue cycling
							animateProgress();
						}
					});
				};

				animateProgress();

				if (onGestureStart) {
					runOnJS(onGestureStart)('longPressCycle');
				}

				// Use runOnUI for progress updates to reduce JS bridge traffic
				if (onLongPressHold) {
					const updateProgress = () => {
						'worklet';
						if (activeGesture.value === 'longPressCycle') {
							runOnJS(onLongPressHold)(longPressProgress.value);
							runOnUI(() => {
								setTimeout(updateProgress, 50);
							})();
						}
					};
					runOnUI(updateProgress)();
				}
			}
		})
		.onEnd(() => {
			'worklet';
			if (activeGesture.value === 'longPressCycle') {
				cancelAnimation(longPressProgress);
				longPressProgress.value = withSpring(0, {damping: 20});
				activeGesture.value = null;
				gesturePriority.value = PRIORITY_NONE;

				if (onGestureEnd) {
					runOnJS(onGestureEnd)('longPressCycle');
				}
			}
		})
		.onFinalize(() => {
			'worklet';
			if (activeGesture.value === 'longPressCycle') {
				cancelAnimation(longPressProgress);
				longPressProgress.value = 0;
				activeGesture.value = null;
				gesturePriority.value = PRIORITY_NONE;
			}
		});

	// Enhanced pan gesture with conflict resolution (optimized)
	const createEnhancedPanGesture = (originalPan: any) => {
		return originalPan
			.shouldCancelWhenOutside(false)
			.onStart(() => {
				'worklet';
				if (canStartGesture('pan', PRIORITY_PAN_ZOOM)) {
					gesturePriority.value = PRIORITY_PAN_ZOOM;
					lastGestureTime.value = Date.now();
					gestureStateRef.current.isPanning = true;
				}
			})
			.onEnd(() => {
				'worklet';
				gestureStateRef.current.isPanning = false;
				gesturePriority.value = PRIORITY_NONE;
			})
			.onFinalize(() => {
				'worklet';
				if (gestureStateRef.current.isPanning) {
					gestureStateRef.current.isPanning = false;
					gesturePriority.value = PRIORITY_NONE;
				}
			});
	};

	// Enhanced pinch gesture with conflict resolution (optimized)
	const createEnhancedPinchGesture = (originalPinch: any) => {
		return originalPinch
			.shouldCancelWhenOutside(false)
			.onStart(() => {
				'worklet';
				if (canStartGesture('zoom', PRIORITY_PAN_ZOOM)) {
					gestureStateRef.current.isZooming = true;
					isMultiTouch.value = true;
					gesturePriority.value = PRIORITY_PAN_ZOOM;
					lastGestureTime.value = Date.now();
				}
			})
			.onEnd(() => {
				'worklet';
				gestureStateRef.current.isZooming = false;
				isMultiTouch.value = false;
				gesturePriority.value = PRIORITY_NONE;
			})
			.onFinalize(() => {
				'worklet';
				if (gestureStateRef.current.isZooming) {
					gestureStateRef.current.isZooming = false;
					isMultiTouch.value = false;
					gesturePriority.value = PRIORITY_NONE;
				}
			});
	};

	// Helper to set drag state (optimized)
	const setDragState = useCallback(
		(isDragging: boolean) => {
			'worklet';
			gestureStateRef.current.isDragging = isDragging;
			if (isDragging) {
				activeGesture.value = 'drag';
				gesturePriority.value = PRIORITY_DRAG;
				lastGestureTime.value = Date.now();
			} else if (activeGesture.value === 'drag') {
				activeGesture.value = null;
				gesturePriority.value = PRIORITY_NONE;
			}
		},
		[activeGesture, gesturePriority, lastGestureTime, PRIORITY_DRAG, PRIORITY_NONE],
	);

	// Compose advanced gestures with proper relationships
	const composeAdvancedGestures = useCallback(
		(...gestures: GestureType[]): ComposedGesture => {
			// Use Simultaneous for better gesture handling
			const navigationGestures = Gesture.Race(
				threeFingerTapGesture,
				twoFingerSwipeGesture,
				longPressCycleGesture,
			);

			// Allow navigation gestures to run alongside other gestures
			if (gestures.length > 0) {
				return Gesture.Simultaneous(navigationGestures, ...gestures);
			}
			return navigationGestures;
		},
		[threeFingerTapGesture, twoFingerSwipeGesture, longPressCycleGesture],
	);

	return {
		// Gesture creators
		createEnhancedPanGesture,
		createEnhancedPinchGesture,
		composeAdvancedGestures,

		// State management
		setDragState,

		// Shared values
		activeGesture,
		longPressProgress,
		isMultiTouch,
		gesturePriority,

		// Individual gestures for custom composition
		twoFingerSwipeGesture,
		threeFingerTapGesture,
		longPressCycleGesture,

		// Priority constants for external use
		PRIORITY_NONE,
		PRIORITY_NAVIGATION,
		PRIORITY_PAN_ZOOM,
		PRIORITY_DRAG,
	};
};
