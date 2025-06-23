// Mobile utility functions for better compatibility

export function setupMobileViewport(): void {
	// Fix for mobile viewport height (accounts for browser chrome)
	function setViewportHeight() {
		const vh = window.innerHeight * 0.01;
		document.documentElement.style.setProperty('--vh', `${vh}px`);
	}

	// Set initial viewport height
	setViewportHeight();

	// Update on resize and orientation change
	window.addEventListener('resize', setViewportHeight);
	window.addEventListener('orientationchange', setViewportHeight);
}

export function preventDefaultTouchBehavior(): void {
	// Prevent pull-to-refresh and bounce scrolling
	document.body.addEventListener(
		'touchmove',
		(e) => {
			// Only prevent default if we're not in a scrollable element
			const target = e.target as HTMLElement;
			const isScrollable = target.closest('.modal-content, .instructions-content');

			if (!isScrollable) {
				e.preventDefault();
			}
		},
		{passive: false},
	);

	// Prevent double-tap zoom on game elements
	let lastTouchEnd = 0;
	document.addEventListener(
		'touchend',
		(e) => {
			const target = e.target as HTMLElement;
			const isGameElement = target.closest('#gameCanvas, .draggable-piece, .control-panel');

			if (isGameElement) {
				const now = Date.now();
				if (now - lastTouchEnd <= 300) {
					e.preventDefault();
				}
				lastTouchEnd = now;
			}
		},
		false,
	);
}

export function addIOSWebAppMeta(): void {
	// Add iOS web app meta tags for better fullscreen experience
	const metaTags = [
		{name: 'apple-mobile-web-app-capable', content: 'yes'},
		{name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent'},
		{
			name: 'viewport',
			content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover',
		},
	];

	metaTags.forEach((tag) => {
		const existingTag = document.querySelector(`meta[name="${tag.name}"]`);
		if (existingTag) {
			existingTag.setAttribute('content', tag.content);
		} else {
			const meta = document.createElement('meta');
			meta.name = tag.name;
			meta.content = tag.content;
			document.head.appendChild(meta);
		}
	});
}

export function setupMobileCompatibility(): void {
	setupMobileViewport();
	preventDefaultTouchBehavior();
	addIOSWebAppMeta();
	optimizeTouchEvents();
}

// Optimize touch event performance
function optimizeTouchEvents(): void {
	// Add touch-action CSS to prevent delays
	const style = document.createElement('style');
	style.textContent = `
        /* Optimize touch responsiveness */
        * {
            touch-action: manipulation;
        }

        /* Allow pan on specific elements */
        .scrollable-container {
            touch-action: pan-y;
        }

        /* Disable all touch actions on canvas */
        #gameCanvas {
            touch-action: none;
        }
    `;
	document.head.appendChild(style);

	// Add fast-click behavior for iOS Safari
	if ('ontouchstart' in window) {
		document.addEventListener(
			'click',
			(_e) => {
				// This helps remove the 300ms delay on older iOS versions
			},
			true,
		);
	}
}
