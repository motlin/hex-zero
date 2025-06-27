import {Capacitor} from '@capacitor/core';

export interface AccessibilityAnnouncement {
	message: string;
	priority: 'low' | 'medium' | 'high';
	interrupt?: boolean;
}

export interface GameStateForA11y {
	currentPiece: number;
	totalPieces: number;
	placedPieces: number;
	remainingPieces: number;
	canUndo: boolean;
	canRedo: boolean;
	isGameWon: boolean;
	hintAvailable: boolean;
}

export class AccessibilityManager {
	private static instance: AccessibilityManager;
	private announcementRegion: HTMLElement | null = null;
	private lastAnnouncement: string = '';
	private isVoiceOverEnabled: boolean = false;
	private isTalkBackEnabled: boolean = false;
	private platform: string = 'web';

	private constructor() {
		this.platform = Capacitor.getPlatform();
		this.initializeAnnouncementRegion();
		this.detectScreenReaders();
		this.setupKeyboardNavigation();
	}

	public static getInstance(): AccessibilityManager {
		if (!AccessibilityManager.instance) {
			AccessibilityManager.instance = new AccessibilityManager();
		}
		return AccessibilityManager.instance;
	}

	private initializeAnnouncementRegion(): void {
		this.announcementRegion = document.createElement('div');
		this.announcementRegion.id = 'a11y-announcements';
		this.announcementRegion.setAttribute('aria-live', 'polite');
		this.announcementRegion.setAttribute('aria-atomic', 'true');
		this.announcementRegion.style.position = 'absolute';
		this.announcementRegion.style.left = '-10000px';
		this.announcementRegion.style.width = '1px';
		this.announcementRegion.style.height = '1px';
		this.announcementRegion.style.overflow = 'hidden';
		document.body.appendChild(this.announcementRegion);
	}

	private detectScreenReaders(): void {
		if (this.platform === 'ios') {
			this.isVoiceOverEnabled = true;
		} else if (this.platform === 'android') {
			this.isTalkBackEnabled = true;
		} else {
			this.isVoiceOverEnabled = window.navigator.userAgent.includes('VoiceOver');
			this.isTalkBackEnabled = window.navigator.userAgent.includes('TalkBack');
		}
	}

	private setupKeyboardNavigation(): void {
		document.addEventListener('keydown', (event) => {
			if (event.altKey && event.key === 'Tab') {
				event.preventDefault();
				this.cycleThroughGameElements();
			}
		});
	}

	public announce(announcement: AccessibilityAnnouncement): void {
		if (!this.announcementRegion) return;

		if (announcement.interrupt) {
			this.announcementRegion.setAttribute('aria-live', 'assertive');
		} else {
			this.announcementRegion.setAttribute('aria-live', 'polite');
		}

		if (announcement.message !== this.lastAnnouncement) {
			this.announcementRegion.textContent = announcement.message;
			this.lastAnnouncement = announcement.message;

			setTimeout(() => {
				if (this.announcementRegion) {
					this.announcementRegion.textContent = '';
				}
			}, 1000);
		}
	}

	public announceGameState(gameState: GameStateForA11y): void {
		const message = `Game state: Piece ${gameState.currentPiece} of ${gameState.totalPieces}. ${gameState.remainingPieces} pieces remaining. ${gameState.canUndo ? 'Undo available' : 'No undo available'}.`;
		this.announce({
			message,
			priority: 'medium',
		});
	}

	public announcePiecePlacement(pieceNumber: number, position: string, successful: boolean): void {
		const action = successful ? 'placed' : 'cannot be placed';
		const message = `Piece ${pieceNumber} ${action} at ${position}.`;
		this.announce({
			message,
			priority: successful ? 'medium' : 'high',
			interrupt: !successful,
		});
	}

	public announceGameWin(stats: {difficulty: string; undos: number; hints: number}): void {
		const message = `Congratulations! Puzzle solved on ${stats.difficulty} difficulty with ${stats.undos} undos and ${stats.hints} hints.`;
		this.announce({
			message,
			priority: 'high',
			interrupt: true,
		});
	}

	public announceHint(position: string): void {
		const message = `Hint: Try placing the current piece at ${position}.`;
		this.announce({
			message,
			priority: 'medium',
		});
	}

	public announceUndo(): void {
		this.announce({
			message: 'Last move undone.',
			priority: 'medium',
		});
	}

	public announceRedo(): void {
		this.announce({
			message: 'Move redone.',
			priority: 'medium',
		});
	}

	public announcePageChange(currentPage: number, totalPages: number, piecesOnPage: number): void {
		const message = `Page ${currentPage + 1} of ${totalPages}. ${piecesOnPage} pieces on this page.`;
		this.announce({
			message,
			priority: 'medium',
		});
	}

	public announceInvalidMove(reason: string): void {
		const message = `Invalid move: ${reason}`;
		this.announce({
			message,
			priority: 'high',
			interrupt: true,
		});
	}

	public getHexPositionDescription(q: number, r: number): string {
		const centerDistance = Math.abs(q) + Math.abs(r) + Math.abs(-q - r);
		const angle = (Math.atan2(r, q) * 180) / Math.PI;

		let direction = '';
		if (angle >= -22.5 && angle < 22.5) direction = 'right';
		else if (angle >= 22.5 && angle < 67.5) direction = 'bottom right';
		else if (angle >= 67.5 && angle < 112.5) direction = 'bottom';
		else if (angle >= 112.5 && angle < 157.5) direction = 'bottom left';
		else if (angle >= 157.5 || angle < -157.5) direction = 'left';
		else if (angle >= -157.5 && angle < -112.5) direction = 'top left';
		else if (angle >= -112.5 && angle < -67.5) direction = 'top';
		else if (angle >= -67.5 && angle < -22.5) direction = 'top right';

		if (centerDistance === 0) {
			return 'center';
		} else if (centerDistance === 1) {
			return `${direction} of center`;
		} else {
			return `${centerDistance} steps ${direction} of center`;
		}
	}

	public setupGameAccessibility(): void {
		this.setupCanvasAccessibility();
		this.setupControlsAccessibility();
		this.setupModalAccessibility();
		this.setupDifficultyScreenAccessibility();
	}

	private setupCanvasAccessibility(): void {
		const canvas = document.getElementById('gameCanvas');
		if (canvas) {
			canvas.setAttribute('role', 'application');
			canvas.setAttribute('aria-label', 'Hex Zero game board');
			canvas.setAttribute(
				'aria-description',
				'Interactive hexagonal puzzle game. Use arrow keys to navigate pieces, space to place, and Tab to move between controls.',
			);
			canvas.setAttribute('tabindex', '0');
		}
	}

	private setupControlsAccessibility(): void {
		const undoBtn = document.getElementById('undoBtn');
		if (undoBtn) {
			undoBtn.setAttribute('aria-label', 'Undo last move');
			undoBtn.setAttribute('aria-keyshortcuts', 'Left Arrow');
		}

		const redoBtn = document.getElementById('redoBtn');
		if (redoBtn) {
			redoBtn.setAttribute('aria-label', 'Redo last undone move');
			redoBtn.setAttribute('aria-keyshortcuts', 'Right Arrow');
		}

		const hintBtn = document.getElementById('hintBtn');
		if (hintBtn) {
			hintBtn.setAttribute('aria-label', 'Show hint for current piece placement');
			hintBtn.setAttribute('aria-keyshortcuts', 'h H');
		}

		const morePiecesBtn = document.getElementById('morePiecesBtn');
		if (morePiecesBtn) {
			morePiecesBtn.setAttribute('aria-label', 'Navigate to next page of pieces');
		}

		const hamburgerBtn = document.getElementById('hamburgerBtn');
		if (hamburgerBtn) {
			hamburgerBtn.setAttribute('aria-label', 'Open game menu');
			hamburgerBtn.setAttribute('aria-expanded', 'false');
			hamburgerBtn.setAttribute('aria-haspopup', 'menu');
		}

		const menuHamburgerBtn = document.getElementById('menuHamburgerBtn');
		if (menuHamburgerBtn) {
			menuHamburgerBtn.setAttribute('aria-label', 'Open main menu');
			menuHamburgerBtn.setAttribute('aria-expanded', 'false');
			menuHamburgerBtn.setAttribute('aria-haspopup', 'menu');
		}
	}

	private setupModalAccessibility(): void {
		const instructionsModal = document.getElementById('instructionsModal');
		if (instructionsModal) {
			instructionsModal.setAttribute('role', 'dialog');
			instructionsModal.setAttribute('aria-labelledby', 'instructions-title');
			instructionsModal.setAttribute('aria-modal', 'true');

			const title = instructionsModal.querySelector('h2');
			if (title) {
				title.id = 'instructions-title';
			}
		}

		const shortcutsModal = document.getElementById('keyboardShortcutsModal');
		if (shortcutsModal) {
			shortcutsModal.setAttribute('role', 'dialog');
			shortcutsModal.setAttribute('aria-labelledby', 'shortcuts-title');
			shortcutsModal.setAttribute('aria-modal', 'true');

			const title = shortcutsModal.querySelector('h2');
			if (title) {
				title.id = 'shortcuts-title';
			}
		}

		const victoryScreen = document.getElementById('victoryScreen');
		if (victoryScreen) {
			victoryScreen.setAttribute('role', 'dialog');
			victoryScreen.setAttribute('aria-labelledby', 'victory-title');
			victoryScreen.setAttribute('aria-modal', 'true');

			const title = victoryScreen.querySelector('.victory-title');
			if (title) {
				title.id = 'victory-title';
			}
		}
	}

	private setupDifficultyScreenAccessibility(): void {
		const difficultyCards = document.querySelectorAll<HTMLElement>('.difficulty-card');
		difficultyCards.forEach((card, index) => {
			card.setAttribute('role', 'button');
			card.setAttribute('tabindex', '0');

			const title = card.querySelector('h3')?.textContent || `Difficulty ${index + 1}`;
			const description = card.querySelector('p')?.textContent || '';
			card.setAttribute('aria-label', `${title} difficulty: ${description}`);

			card.addEventListener('keydown', (event: KeyboardEvent) => {
				if (event.key === 'Enter' || event.key === ' ') {
					event.preventDefault();
					card.click();
				}
			});
		});
	}

	public setupPieceAccessibility(pieceContainer: HTMLElement, pieceIndex: number, isPlaced: boolean): void {
		pieceContainer.setAttribute('role', 'button');
		pieceContainer.setAttribute('tabindex', isPlaced ? '-1' : '0');

		const label = isPlaced
			? `Piece ${pieceIndex + 1} - already placed`
			: `Piece ${pieceIndex + 1} - drag to place on board`;

		pieceContainer.setAttribute('aria-label', label);
		pieceContainer.setAttribute('aria-grabbed', 'false');

		if (!isPlaced) {
			pieceContainer.addEventListener('keydown', (event) => {
				if (event.key === 'Enter' || event.key === ' ') {
					event.preventDefault();
					this.announce({
						message: `Piece ${pieceIndex + 1} selected. Use arrow keys to position and Enter to place.`,
						priority: 'medium',
					});
				}
			});
		}
	}

	public updateHamburgerMenuAccessibility(isOpen: boolean, buttonId: string): void {
		const button = document.getElementById(buttonId);
		if (button) {
			button.setAttribute('aria-expanded', isOpen.toString());
		}
	}

	public updateButtonStates(canUndo: boolean, canRedo: boolean): void {
		const undoBtn = document.getElementById('undoBtn') as HTMLButtonElement;
		if (undoBtn) {
			undoBtn.disabled = !canUndo;
			undoBtn.setAttribute('aria-disabled', (!canUndo).toString());
		}

		const redoBtn = document.getElementById('redoBtn') as HTMLButtonElement;
		if (redoBtn) {
			redoBtn.disabled = !canRedo;
			redoBtn.setAttribute('aria-disabled', (!canRedo).toString());
		}
	}

	public announceZoomChange(zoomLevel: number): void {
		const percentage = Math.round(zoomLevel * 100);
		this.announce({
			message: `Zoom level: ${percentage} percent`,
			priority: 'low',
		});
	}

	public announcePageNavigation(direction: 'previous' | 'next'): void {
		this.announce({
			message: `Navigated to ${direction} page of pieces`,
			priority: 'medium',
		});
	}

	private cycleThroughGameElements(): void {
		const gameElements = ['gameCanvas', 'undoBtn', 'hintBtn', 'redoBtn', 'morePiecesBtn', 'hamburgerBtn'];

		const currentFocus = document.activeElement;
		const currentIndex = gameElements.findIndex((id) => document.getElementById(id) === currentFocus);

		const nextIndex = (currentIndex + 1) % gameElements.length;
		const nextElementId = gameElements[nextIndex];
		if (!nextElementId) return;
		const nextElement = document.getElementById(nextElementId);

		if (nextElement && !nextElement.hasAttribute('disabled')) {
			nextElement.focus();
		}
	}

	public isScreenReaderActive(): boolean {
		return this.isVoiceOverEnabled || this.isTalkBackEnabled;
	}

	public setupFocusManagement(): void {
		const gameScreen = document.getElementById('gameScreen');
		const difficultyScreen = document.getElementById('difficultyScreen');

		const observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				if (mutation.attributeName === 'class') {
					const target = mutation.target as HTMLElement;

					if (target === gameScreen && !target.classList.contains('hidden')) {
						const canvas = document.getElementById('gameCanvas');
						if (canvas) {
							canvas.focus();
						}
					} else if (target === difficultyScreen && !target.classList.contains('hidden')) {
						const firstCard = document.querySelector('.difficulty-card');
						if (firstCard) {
							(firstCard as HTMLElement).focus();
						}
					}
				}
			});
		});

		if (gameScreen) {
			observer.observe(gameScreen, {attributes: true});
		}
		if (difficultyScreen) {
			observer.observe(difficultyScreen, {attributes: true});
		}
	}
}

export default AccessibilityManager;
