/**
 * 🕐 RequestIdleCallback polyfill for better mobile performance
 */

function setupIdleCallbackPolyfill(): void {
	if (typeof Reflect.get(window, 'requestIdleCallback') !== 'function') {
		Reflect.set(
			window,
			'requestIdleCallback',
			function (callback: IdleRequestCallback, options?: IdleRequestOptions) {
				const start = Date.now();
				const timeout = options?.timeout ?? 1;

				return window.setTimeout(() => {
					callback({
						didTimeout: false,
						timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
					});
				}, timeout);
			},
		);
	}

	if (typeof Reflect.get(window, 'cancelIdleCallback') !== 'function') {
		Reflect.set(window, 'cancelIdleCallback', function (handle: number): void {
			clearTimeout(handle);
		});
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

	const timeout = options?.priority === 'high' ? 16 : options?.priority === 'low' ? 1000 : (options?.timeout ?? 100);

	return window.requestIdleCallback(work, {timeout});
}
