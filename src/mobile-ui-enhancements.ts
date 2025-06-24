// Mobile UI Enhancement Module

import {addTouchFeedback} from './touch-optimizer';

/**
 * Enhanced mobile-specific UI interactions
 */
export class MobileUIEnhancer {
	private pieceNavButtons: {prev: HTMLButtonElement | null; next: HTMLButtonElement | null} = {
		prev: null,
		next: null,
	};

	constructor() {
		this.setupEnhancements();
	}

	private setupEnhancements(): void {
		// Enhance hamburger menu
		this.enhanceHamburgerMenu();

		// Enhance bottom control panel
		this.enhanceBottomControlPanel();

		// Add visual feedback to all buttons
		this.addUniversalTouchFeedback();

		// Setup screen density adjustments
		this.adjustForScreenDensity();
	}

	private enhanceHamburgerMenu(): void {
		const hamburgerButtons = document.querySelectorAll('.hamburger-button');

		hamburgerButtons.forEach((button) => {
			// Add enhanced touch feedback
			addTouchFeedback(button as HTMLElement, {
				scale: 0.9,
				duration: 150,
				activeClass: 'hamburger-active',
			});

			// Add haptic feedback for menu open/close
			button.addEventListener('click', () => {
				if ('vibrate' in navigator) {
					navigator.vibrate(10);
				}
			});
		});

		// Enhance dropdown menu items
		const dropdownButtons = document.querySelectorAll('.hamburger-dropdown button');
		dropdownButtons.forEach((button) => {
			addTouchFeedback(button as HTMLElement, {
				scale: 0.97,
				duration: 100,
			});
		});
	}

	private enhanceBottomControlPanel(): void {
		// Add piece navigation buttons for mobile
		this.addPieceNavigationButtons();

		// Enhance draggable pieces
		this.enhanceDraggablePieces();

		// Enhance bottom control buttons
		this.enhanceBottomControls();
	}

	private addPieceNavigationButtons(): void {
		const piecePanel = document.querySelector('.piece-panel');
		if (!piecePanel) return;

		// Create previous button
		const prevBtn = document.createElement('button');
		prevBtn.className = 'piece-nav-button prev';
		prevBtn.innerHTML = '‹';
		// Initially hidden
		prevBtn.style.display = 'none';

		// Create next button
		const nextBtn = document.createElement('button');
		nextBtn.className = 'piece-nav-button next';
		nextBtn.innerHTML = '›';
		// Initially hidden
		nextBtn.style.display = 'none';

		// Add touch feedback
		addTouchFeedback(prevBtn, {scale: 0.85, duration: 100});
		addTouchFeedback(nextBtn, {scale: 0.85, duration: 100});

		// Insert buttons
		piecePanel.insertBefore(prevBtn, piecePanel.firstChild);
		piecePanel.appendChild(nextBtn);

		this.pieceNavButtons = {prev: prevBtn, next: nextBtn};

		// Setup navigation handlers
		prevBtn.addEventListener('click', () => {
			this.navigatePieces('prev');
		});

		nextBtn.addEventListener('click', () => {
			this.navigatePieces('next');
		});
	}

	private navigatePieces(direction: 'prev' | 'next'): void {
		const container = document.getElementById('piecesContainer');
		if (!container) return;

		// Haptic feedback
		if ('vibrate' in navigator) {
			navigator.vibrate(5);
		}

		// Smooth scroll animation
		const scrollAmount = container.clientWidth * 0.8;
		const currentScroll = container.scrollLeft;
		const targetScroll = direction === 'next' ? currentScroll + scrollAmount : currentScroll - scrollAmount;

		container.scrollTo({
			left: targetScroll,
			behavior: 'smooth',
		});

		// Update navigation button visibility after scroll
		setTimeout(() => this.updateNavigationButtons(), 300);
	}

	private updateNavigationButtons(): void {
		const container = document.getElementById('piecesContainer');
		if (!container || !this.pieceNavButtons.prev || !this.pieceNavButtons.next) return;

		const scrollLeft = container.scrollLeft;
		const scrollWidth = container.scrollWidth;
		const clientWidth = container.clientWidth;

		// Show/hide navigation buttons based on scroll position
		this.pieceNavButtons.prev.style.display = scrollLeft > 10 ? 'flex' : 'none';
		this.pieceNavButtons.next.style.display = scrollLeft < scrollWidth - clientWidth - 10 ? 'flex' : 'none';
	}

	private enhanceDraggablePieces(): void {
		// Add mutation observer to enhance new pieces as they're added
		const container = document.getElementById('piecesContainer');
		if (!container) return;

		const observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				mutation.addedNodes.forEach((node) => {
					if (node instanceof HTMLElement && node.classList.contains('draggable-piece')) {
						this.enhanceDraggablePiece(node);
					}
				});
			});
		});

		observer.observe(container, {childList: true});

		// Enhance existing pieces
		container.querySelectorAll('.draggable-piece').forEach((piece) => {
			this.enhanceDraggablePiece(piece as HTMLElement);
		});

		// Listen for container scroll to update nav buttons
		container.addEventListener('scroll', () => {
			this.updateNavigationButtons();
		});
	}

	private enhanceDraggablePiece(piece: HTMLElement): void {
		// Add touch feedback with special dragging class
		addTouchFeedback(piece, {
			scale: 1.05,
			duration: 150,
			activeClass: 'piece-active',
		});

		// Add long-press visual indicator
		let longPressTimer: number | null = null;

		piece.addEventListener('touchstart', () => {
			longPressTimer = window.setTimeout(() => {
				piece.classList.add('ready-to-drag');
				if ('vibrate' in navigator) {
					navigator.vibrate(20);
				}
			}, 200);
		});

		piece.addEventListener('touchend', () => {
			if (longPressTimer) {
				clearTimeout(longPressTimer);
				piece.classList.remove('ready-to-drag');
			}
		});

		piece.addEventListener('touchcancel', () => {
			if (longPressTimer) {
				clearTimeout(longPressTimer);
				piece.classList.remove('ready-to-drag');
			}
		});
	}

	private enhanceBottomControls(): void {
		const controls = document.querySelectorAll('.bottom-controls button');

		controls.forEach((button) => {
			// Add enhanced touch feedback
			addTouchFeedback(button as HTMLElement, {
				scale: 0.92,
				duration: 120,
				activeClass: 'control-active',
			});

			// Add haptic feedback
			button.addEventListener('click', () => {
				if ('vibrate' in navigator) {
					navigator.vibrate(8);
				}
			});
		});
	}

	private addUniversalTouchFeedback(): void {
		// Add touch feedback to all interactive elements
		const interactiveElements = document.querySelectorAll(
			'button:not(.hamburger-button):not(.piece-nav-button):not(.bottom-controls button), ' + '.difficulty-card',
		);

		interactiveElements.forEach((element) => {
			addTouchFeedback(element as HTMLElement, {
				scale: 0.97,
				duration: 150,
			});
		});
	}

	private adjustForScreenDensity(): void {
		// Get device pixel ratio
		const dpr = window.devicePixelRatio || 1;

		// Add class based on screen density
		if (dpr >= 3) {
			document.body.classList.add('high-dpi-3x');
		} else if (dpr >= 2) {
			document.body.classList.add('high-dpi-2x');
		}

		// Adjust for screen size
		const screenWidth = window.screen.width;
		const screenHeight = window.screen.height;

		// Tablet detection
		if (Math.min(screenWidth, screenHeight) >= 768) {
			document.body.classList.add('tablet-size');
		}

		// Phablet detection
		if (Math.min(screenWidth, screenHeight) >= 414 && Math.min(screenWidth, screenHeight) < 768) {
			document.body.classList.add('phablet-size');
		}
	}

	/**
	 * Update UI for orientation changes
	 */
	public handleOrientationChange(): void {
		// Update navigation buttons visibility
		setTimeout(() => {
			this.updateNavigationButtons();
		}, 100);

		// Adjust control panel layout
		const isPortrait = window.matchMedia('(orientation: portrait)').matches;
		document.body.classList.toggle('portrait-mode', isPortrait);
		document.body.classList.toggle('landscape-mode', !isPortrait);
	}

	/**
	 * Clean up event listeners and observers
	 */
	public destroy(): void {
		// Clean up any observers or listeners if needed
	}
}

// Auto-initialize on load
let mobileEnhancer: MobileUIEnhancer | null = null;

export function initializeMobileUIEnhancements(): void {
	if (!mobileEnhancer) {
		mobileEnhancer = new MobileUIEnhancer();

		// Handle orientation changes
		window.addEventListener('orientationchange', () => {
			mobileEnhancer?.handleOrientationChange();
		});

		// Also handle resize for desktop testing
		window.addEventListener('resize', () => {
			mobileEnhancer?.handleOrientationChange();
		});
	}
}

export function getMobileUIEnhancer(): MobileUIEnhancer | null {
	return mobileEnhancer;
}
