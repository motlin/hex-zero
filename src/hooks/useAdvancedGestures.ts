/**
 * Advanced gesture recognition hook
 * Implements multi-finger gestures, long press piece cycling, and gesture conflict resolution
 */

import {useRef, useCallback} from 'react';
import {Gesture, GestureType, ComposedGesture} from 'react-native-gesture-handler';
import {runOnJS, useSharedValue, withSpring, withTiming, cancelAnimation} from 'react-native-reanimated';

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
		enablePanWhileDragging = false,
		swipeThreshold = 50,
		onGestureStart,
		onGestureEnd,
	} = options;

	// Shared values for gesture state
	const activeGesture = useSharedValue<string | null>(null);
	const longPressProgress = useSharedValue(0);
	const isMultiTouch = useSharedValue(false);

	// Refs for gesture state management
	const gestureStateRef = useRef({
		isDragging: false,
		isPanning: false,
		isZooming: false,
	});

	// Helper to check if gesture should be allowed
	const canStartGesture = useCallback(
		(gestureType: string) => {
			'worklet';

			// Priority system: drag > zoom > pan > navigation
			if (gestureType === 'drag') return true;

			if (gestureType === 'zoom') {
				return !gestureStateRef.current.isDragging;
			}

			if (gestureType === 'pan') {
				return (
					!gestureStateRef.current.isDragging &&
					!gestureStateRef.current.isZooming &&
					(enablePanWhileDragging || !activeGesture.value)
				);
			}

			if (gestureType === 'navigation') {
				return (
					!gestureStateRef.current.isDragging &&
					!gestureStateRef.current.isPanning &&
					!gestureStateRef.current.isZooming
				);
			}

			return true;
		},
		[enablePanWhileDragging, activeGesture],
	);

	// Two-finger swipe gesture for piece navigation
	const twoFingerSwipeGesture = Gesture.Pan()
		.minPointers(2)
		.minDistance(swipeThreshold)
		.onStart(() => {
			'worklet';
			if (canStartGesture('navigation')) {
				isMultiTouch.value = true;
				activeGesture.value = 'twoFingerSwipe';
				if (onGestureStart) {
					runOnJS(onGestureStart)('twoFingerSwipe');
				}
			}
		})
		.onUpdate((event: any) => {
			'worklet';
			if (activeGesture.value !== 'twoFingerSwipe') return;

			// Detect swipe direction
			const velocityX = event.velocityX;
			const threshold = 300;

			if (Math.abs(velocityX) > threshold) {
				if (velocityX > 0 && onTwoFingerSwipeRight) {
					runOnJS(onTwoFingerSwipeRight)();
					activeGesture.value = null;
				} else if (velocityX < 0 && onTwoFingerSwipeLeft) {
					runOnJS(onTwoFingerSwipeLeft)();
					activeGesture.value = null;
				}
			}
		})
		.onEnd(() => {
			'worklet';
			if (activeGesture.value === 'twoFingerSwipe') {
				isMultiTouch.value = false;
				activeGesture.value = null;
				if (onGestureEnd) {
					runOnJS(onGestureEnd)('twoFingerSwipe');
				}
			}
		});

	// Three-finger tap for special actions (e.g., show all pieces)
	const threeFingerTapGesture = Gesture.Tap()
		.minPointers(3)
		.numberOfTaps(1)
		.onEnd(() => {
			'worklet';
			if (canStartGesture('navigation') && onThreeFingerTap) {
				runOnJS(onThreeFingerTap)();
			}
		});

	// Long press with progress for piece cycling
	const longPressCycleGesture = Gesture.LongPress()
		.minDuration(600)
		.onStart(() => {
			'worklet';
			if (canStartGesture('navigation')) {
				activeGesture.value = 'longPressCycle';

				// Animate progress from 0 to 1
				longPressProgress.value = withTiming(
					1,
					{
						duration: 1000,
					},
					(finished) => {
						if (finished && onLongPressCycle) {
							runOnJS(onLongPressCycle)();
							// Reset for next cycle
							longPressProgress.value = 0;
							longPressProgress.value = withTiming(1, {duration: 1000});
						}
					},
				);

				if (onGestureStart) {
					runOnJS(onGestureStart)('longPressCycle');
				}

				// Start progress updates
				if (onLongPressHold) {
					const interval = setInterval(() => {
						runOnJS(onLongPressHold)(longPressProgress.value);
					}, 50);

					// Store interval for cleanup
					(longPressCycleGesture as any)._progressInterval = interval;
				}
			}
		})
		.onEnd(() => {
			'worklet';
			if (activeGesture.value === 'longPressCycle') {
				cancelAnimation(longPressProgress);
				longPressProgress.value = withSpring(0);
				activeGesture.value = null;

				// Clear progress interval
				const interval = (longPressCycleGesture as any)._progressInterval;
				if (interval) {
					runOnJS(() => clearInterval(interval))();
					(longPressCycleGesture as any)._progressInterval = null;
				}

				if (onGestureEnd) {
					runOnJS(onGestureEnd)('longPressCycle');
				}
			}
		});

	// Enhanced pan gesture with conflict resolution
	const createEnhancedPanGesture = (originalPan: GestureType) => {
		return originalPan
			.onStart(() => {
				'worklet';
				if (canStartGesture('pan')) {
					gestureStateRef.current.isPanning = true;
				}
			})
			.onEnd(() => {
				'worklet';
				gestureStateRef.current.isPanning = false;
			});
	};

	// Enhanced pinch gesture with conflict resolution
	const createEnhancedPinchGesture = (originalPinch: GestureType) => {
		return originalPinch
			.onStart(() => {
				'worklet';
				if (canStartGesture('zoom')) {
					gestureStateRef.current.isZooming = true;
					isMultiTouch.value = true;
				}
			})
			.onEnd(() => {
				'worklet';
				gestureStateRef.current.isZooming = false;
				isMultiTouch.value = false;
			});
	};

	// Helper to set drag state
	const setDragState = useCallback(
		(isDragging: boolean) => {
			gestureStateRef.current.isDragging = isDragging;
			if (isDragging) {
				activeGesture.value = 'drag';
			} else if (activeGesture.value === 'drag') {
				activeGesture.value = null;
			}
		},
		[activeGesture],
	);

	// Compose advanced gestures
	const composeAdvancedGestures = useCallback(
		(...gestures: GestureType[]): ComposedGesture => {
			return Gesture.Race(threeFingerTapGesture, twoFingerSwipeGesture, longPressCycleGesture, ...gestures);
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

		// Individual gestures for custom composition
		twoFingerSwipeGesture,
		threeFingerTapGesture,
		longPressCycleGesture,
	};
};
