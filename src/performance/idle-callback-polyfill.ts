/**
 * 🕐 RequestIdleCallback polyfill for better mobile performance
 */

interface IdleDeadline {
	readonly didTimeout: boolean;
	timeRemaining(): number;
}

interface IdleRequestOptions {
	timeout?: number;
}

type IdleRequestCallback = (deadline: IdleDeadline) => void;

declare global {
	interface Window {
		requestIdleCallback: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
		cancelIdleCallback: (handle: number) => void;
	}
}

export function setupIdleCallbackPolyfill(): void {
	if (!window.requestIdleCallback) {
		window.requestIdleCallback = function (callback: IdleRequestCallback, options?: IdleRequestOptions): number {
			const start = Date.now();
			const timeout = options?.timeout || 1;

			return window.setTimeout(() => {
				callback({
					didTimeout: false,
					timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
				});
			}, timeout) as unknown as number;
		};
	}

	if (!window.cancelIdleCallback) {
		window.cancelIdleCallback = function (handle: number): void {
			clearTimeout(handle);
		};
	}
}

/**
 * Schedule work during idle periods
 */
export function scheduleIdleWork(
	work: () => void,
	options?: {timeout?: number; priority?: 'high' | 'normal' | 'low'},
): number {
	setupIdleCallbackPolyfill();

	const timeout = options?.priority === 'high' ? 16 : options?.priority === 'low' ? 1000 : options?.timeout || 100;

	return window.requestIdleCallback!(work, {timeout});
}

/**
 * Cancel scheduled idle work
 */
export function cancelIdleWork(handle: number): void {
	if (window.cancelIdleCallback) {
		window.cancelIdleCallback(handle);
	}
}
