import confetti from 'canvas-confetti';
import {GameState, type HexCoordinate, type Piece} from './game-state';
import {HexRenderer} from './renderer/HexRenderer';
import {DEFAULT_COLORS, type ColorMap} from './ui/ColorTheme';
import {CanvasManager} from './canvas/CanvasManager';
import {AchievementManager} from './achievements/AchievementManager';
import type {DifficultyLevel} from './achievements/AchievementDefinitions';

declare global {
	interface Window {
		startGame: (radius: number, numPieces: number) => void;
		startCustomGame: () => void;
		showDifficultyScreen: () => void;
		showInstructions: () => void;
		game: HexSeptominoGame | null;
	}
}

interface AnimatingHex {
	q: number;
	r: number;
	centerQ: number;
	centerR: number;
	startHeight: number;
	targetHeight: number;
	progress: number;
	delay: number;
}

let game: HexSeptominoGame | null = null;
let globalAchievementManager: AchievementManager | null = null;

function startGame(radius: number, numPieces: number): void {
	document.getElementById('difficultyScreen')!.classList.add('hidden');
	document.getElementById('gameScreen')!.classList.remove('hidden');

	game = new HexSeptominoGame(radius, numPieces);
	window.game = game;
}

function startCustomGame(): void {
	const radius = parseInt((document.getElementById('customRadius') as HTMLInputElement).value);
	const pieces = parseInt((document.getElementById('customPieces') as HTMLInputElement).value);
	startGame(radius, pieces);
}

function showDifficultyScreen(): void {
	document.getElementById('gameScreen')!.classList.add('hidden');
	document.getElementById('difficultyScreen')!.classList.remove('hidden');
}

function showInstructions(): void {
	const modal = document.getElementById('instructionsModal');
	if (modal) {
		modal.classList.remove('hidden');
	}
}

function hideInstructions(): void {
	const modal = document.getElementById('instructionsModal');
	const dontShowAgain = document.getElementById('dontShowAgain') as HTMLInputElement;

	if (modal) {
		modal.classList.add('hidden');
	}

	if (dontShowAgain?.checked) {
		localStorage.setItem('hexZeroDontShowInstructions', 'true');
	}
}

window.addEventListener('DOMContentLoaded', () => {
	globalAchievementManager = new AchievementManager();
	globalAchievementManager.initialize();

	const instructionsModal = document.getElementById('instructionsModal');
	const instructionsOverlay = instructionsModal?.querySelector('.modal-overlay');
	const closeInstructionsBtn = document.getElementById('closeInstructionsBtn');

	if (closeInstructionsBtn) {
		closeInstructionsBtn.addEventListener('click', hideInstructions);
	}

	if (instructionsOverlay) {
		instructionsOverlay.addEventListener('click', hideInstructions);
	}

	const hamburgerBtn = document.getElementById('hamburgerBtn') as HTMLElement;
	const hamburgerMenu = document.getElementById('hamburgerMenu') as HTMLElement;

	if (hamburgerBtn && hamburgerMenu) {
		hamburgerBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			hamburgerMenu.classList.toggle('hidden');
		});

		document.addEventListener('click', (e) => {
			if (!hamburgerBtn.contains(e.target as Node) && !hamburgerMenu.contains(e.target as Node)) {
				hamburgerMenu.classList.add('hidden');
			}
		});

		hamburgerMenu.addEventListener('click', () => {
			setTimeout(() => hamburgerMenu.classList.add('hidden'), 100);
		});
	}

	const newGameBtn = document.getElementById('newGameBtn');
	if (newGameBtn) {
		newGameBtn.addEventListener('click', () => showDifficultyScreen());
	}

	const restartBtn = document.getElementById('restartBtn');
	if (restartBtn) {
		restartBtn.addEventListener('click', () => {
			if (window.game) {
				window.game.restart();
			}
		});
	}

	const howToPlayBtn = document.getElementById('howToPlayBtn');
	if (howToPlayBtn) {
		howToPlayBtn.addEventListener('click', () => showInstructions());
	}

	const achievementsButton = document.getElementById('achievementsButton');
	if (achievementsButton) {
		achievementsButton.addEventListener('click', () => {
			globalAchievementManager?.showAchievements();
		});
	}

	const menuHamburgerBtn = document.getElementById('menuHamburgerBtn');
	const menuHamburgerMenu = document.getElementById('menuHamburgerMenu');
	const howToPlayMenuBtn = document.getElementById('howToPlayMenuBtn');

	if (menuHamburgerBtn && menuHamburgerMenu) {
		menuHamburgerBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			menuHamburgerMenu.classList.toggle('hidden');
		});

		document.addEventListener('click', (e) => {
			if (!menuHamburgerBtn.contains(e.target as Node) && !menuHamburgerMenu.contains(e.target as Node)) {
				menuHamburgerMenu.classList.add('hidden');
			}
		});
	}

	if (howToPlayMenuBtn) {
		howToPlayMenuBtn.addEventListener('click', () => {
			menuHamburgerMenu?.classList.add('hidden');
			showInstructions();
		});
	}

	const menuAchievementsButton = document.getElementById('menuAchievementsButton');
	if (menuAchievementsButton && globalAchievementManager) {
		menuAchievementsButton.addEventListener('click', () => {
			menuHamburgerMenu?.classList.add('hidden');
			globalAchievementManager?.showAchievements();
		});
		const count = globalAchievementManager.getUnlockedCount();
		const total = globalAchievementManager.getTotalCount();
		menuAchievementsButton.textContent = `🏆 Achievements (${count}/${total})`;
	}

	const isFirstTime = localStorage.getItem('hexZeroFirstTime') === null;
	const dontShowInstructions = localStorage.getItem('hexZeroDontShowInstructions') === 'true';

	if (isFirstTime && !dontShowInstructions) {
		showInstructions();
		localStorage.setItem('hexZeroFirstTime', 'false');
	}

	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape' && instructionsModal && !instructionsModal.classList.contains('hidden')) {
			hideInstructions();
		}
	});
});

class HexSeptominoGame {
	private canvasManager: CanvasManager;
	private gameState: GameState;
	private renderer: HexRenderer;
	private colors: ColorMap;
	private mouseHex: HexCoordinate | null;
	private touchHex: HexCoordinate | null;
	private isTouching: boolean;
	private zoomFactor: number;
	private hintPos: HexCoordinate | null;
	private hintTimeout: number | null;
	private animatingHexes: AnimatingHex[];
	private animationStartTime: number | null;
	private animationDuration: number;
	private isPanning: boolean;
	private panStartX: number;
	private panStartY: number;
	private panOffsetX: number;
	private panOffsetY: number;
	private lastPinchDistance: number | null;
	private invalidPlacementAnimation: {
		isActive: boolean;
		startTime: number;
		position: HexCoordinate;
		duration: number;
	} | null;
	private achievementManager: AchievementManager;

	private currentPage: number;
	private piecesPerPage: number;
	private isDragging: boolean;
	private draggedPieceIndex: number | null;
	private draggedPieceElement: HTMLElement | null;
	private dragPreviewElement: HTMLElement | null;
	private dragHoverHex: HexCoordinate | null;

	private swipeStartX: number | null;
	private swipeStartY: number | null;
	private isSwipingPanel: boolean;

	constructor(radius: number, numPieces: number) {
		this.canvasManager = new CanvasManager('gameCanvas', 'piecePreview');
		this.gameState = new GameState(radius, numPieces);
		this.renderer = new HexRenderer(30);
		this.updateCanvasSize();

		this.colors = DEFAULT_COLORS;

		this.mouseHex = null;
		this.touchHex = null;
		this.isTouching = false;
		this.zoomFactor = 1.0;
		this.hintPos = null;
		this.hintTimeout = null;
		this.animatingHexes = [];
		this.animationStartTime = null;
		this.animationDuration = 750;
		this.isPanning = false;
		this.panStartX = 0;
		this.panStartY = 0;
		this.panOffsetX = 0;
		this.panOffsetY = 0;
		this.lastPinchDistance = null;
		this.invalidPlacementAnimation = null;

		this.currentPage = 0;
		this.piecesPerPage = 3;
		this.isDragging = false;
		this.draggedPieceIndex = null;
		this.draggedPieceElement = null;
		this.dragPreviewElement = null;
		this.dragHoverHex = null;

		this.swipeStartX = null;
		this.swipeStartY = null;
		this.isSwipingPanel = false;

		this.achievementManager = globalAchievementManager!;
		this.achievementManager.trackGameStart();

		this.setupEventListeners();
		this.updateUI();
		this.render();
		this.renderBottomPanel();

		setTimeout(() => {
			this.updateCanvasSize();
			this.render();
			this.renderBottomPanel();
		}, 100);

		window.addEventListener('resize', () => {
			this.updateCanvasSize();
			this.render();
			this.renderBottomPanel();
		});
	}

	private updateCanvasSize(): void {
		const settings = this.gameState.getSettings();
		this.renderer.hexSize = this.canvasManager.updateCanvasSize(settings.radius, this.zoomFactor);
	}

	private setupEventListeners(): void {
		const canvas = this.canvasManager.getCanvas();
		canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
		canvas.addEventListener('click', (e) => this.handleClick(e));
		canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
		canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));

		canvas.addEventListener(
			'wheel',
			(e) => {
				e.preventDefault();

				if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
					this.handleWheelEvent(e);
				}
			},
			{passive: false},
		);
		canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), {passive: false});
		canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), {passive: false});
		canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), {passive: false});
		canvas.addEventListener('touchcancel', (e) => this.handleTouchCancel(e));
		canvas.addEventListener('mouseleave', () => {
			this.mouseHex = null;
			this.isPanning = false;
			this.render();
		});

		document.addEventListener('keydown', (e) => this.handleKeyPress(e));
		(document.getElementById('hintBtn') as HTMLElement).addEventListener('click', () => this.toggleHint());

		(document.getElementById('undoBtn') as HTMLElement).addEventListener('click', () => this.undo());
		(document.getElementById('redoBtn') as HTMLElement).addEventListener('click', () => this.redo());

		(document.getElementById('morePiecesBtn') as HTMLElement).addEventListener('click', () => this.morePieces());

		const closeBtn = document.getElementById('closeShortcutsBtn');
		const modal = document.getElementById('keyboardShortcutsModal');
		const modalOverlay = modal?.querySelector('.modal-overlay');

		if (closeBtn) {
			closeBtn.addEventListener('click', () => this.toggleKeyboardShortcuts());
		}

		if (modalOverlay) {
			modalOverlay.addEventListener('click', () => this.toggleKeyboardShortcuts());
		}

		const showInstructionsFromShortcuts = document.getElementById('showInstructionsFromShortcuts');
		if (showInstructionsFromShortcuts) {
			showInstructionsFromShortcuts.addEventListener('click', () => {
				this.toggleKeyboardShortcuts();
				showInstructions();
			});
		}

		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape') {
				if (modal && !modal.classList.contains('hidden')) {
					this.toggleKeyboardShortcuts();
				}
			}
		});

		this.setupPanelSwipeHandlers();
	}

	private setupPanelSwipeHandlers(): void {
		const piecesContainer = document.getElementById('piecesContainer');
		if (!piecesContainer) return;

		piecesContainer.addEventListener(
			'touchstart',
			(e) => {
				if (e.touches.length >= 2) {
					const firstTouch = e.touches[0];
					if (!firstTouch) return;
					this.swipeStartX = firstTouch.clientX;
					this.swipeStartY = firstTouch.clientY;
					this.isSwipingPanel = true;
					this.touchHex = null;
					this.isTouching = false;
				}
			},
			{passive: true},
		);

		piecesContainer.addEventListener(
			'touchmove',
			(e) => {
				if (this.isSwipingPanel && e.touches.length >= 2 && this.swipeStartX !== null) {
					e.preventDefault();
				}
			},
			{passive: false},
		);

		piecesContainer.addEventListener(
			'touchend',
			(e) => {
				if (this.isSwipingPanel && this.swipeStartX !== null && this.swipeStartY !== null) {
					const touch = e.changedTouches[0];
					if (!touch) return;
					const deltaX = touch.clientX - this.swipeStartX;
					const deltaY = touch.clientY - this.swipeStartY;

					const swipeThreshold = 50;
					if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > swipeThreshold) {
						if (deltaX > 0) {
							this.previousPage();
						} else {
							this.nextPage();
						}
					}

					this.swipeStartX = null;
					this.swipeStartY = null;
					this.isSwipingPanel = false;
				}
			},
			{passive: true},
		);

		piecesContainer.addEventListener(
			'touchcancel',
			() => {
				this.swipeStartX = null;
				this.swipeStartY = null;
				this.isSwipingPanel = false;
			},
			{passive: true},
		);
	}

	private canPlacePiece(piece: Piece, centerQ: number, centerR: number, checkHeight: boolean = true): boolean {
		return this.gameState.canPlacePiece(piece, centerQ, centerR, checkHeight);
	}

	private placePiece(centerQ: number, centerR: number): void {
		this.clearHint();

		const piece = this.gameState.getCurrentPiece();
		const grid = this.gameState.getGrid();

		this.animatingHexes = [];

		const sortedPieces = piece.tiles.slice().sort((a, b) => {
			if (a.q === 0 && a.r === 0) return -1;
			if (b.q === 0 && b.r === 0) return 1;

			if (a.q === 0 && a.r === -1) return -1;
			if (b.q === 0 && b.r === -1) return 1;

			const angleA = Math.atan2(a.r, a.q);
			const angleB = Math.atan2(b.r, b.q);

			const adjustedA = (angleA + Math.PI * 2.5) % (Math.PI * 2);
			const adjustedB = (angleB + Math.PI * 2.5) % (Math.PI * 2);

			return adjustedA - adjustedB;
		});

		sortedPieces.forEach((tile, index) => {
			const adjustedQ = centerQ + tile.q - piece.center.q;
			const adjustedR = centerR + tile.r - piece.center.r;
			const hex = grid.getHex(adjustedQ, adjustedR);
			if (hex && hex.height > 0) {
				const delay = index * 100;

				this.animatingHexes.push({
					q: hex.q,
					r: hex.r,
					centerQ: centerQ,
					centerR: centerR,
					startHeight: hex.height,
					targetHeight: hex.height - 1,
					progress: 0,
					delay: delay,
				});
			}
		});

		const currentPieceIndex = this.gameState.getCurrentPieceIndex();

		const placed = this.gameState.placePiece(centerQ, centerR);
		if (!placed) return;

		this.achievementManager.trackPiecePlaced(currentPieceIndex);
		this.achievementManager.trackMove();

		this.animationStartTime = performance.now();
		this.requestAnimationFrame();

		this.updateUI();

		setTimeout(() => {
			this.checkWinCondition();
			this.render();
			this.renderPieceNavigation();

			this.checkAndAdvancePage();
		}, this.animationDuration);
	}

	cyclePiece(direction: number): void {
		const cycled = this.gameState.cyclePiece(direction);
		if (cycled) {
			this.updateUI();
			this.render();
			this.renderBottomPanel();
		}
	}

	morePieces(): void {
		const pieces = this.gameState.getPieces();
		const maxPages = Math.ceil(pieces.length / this.piecesPerPage);

		if (maxPages <= 1) return;

		let nextPage = this.currentPage;
		let attempts = 0;

		do {
			nextPage = (nextPage + 1) % maxPages;
			attempts++;

			const startIndex = nextPage * this.piecesPerPage;
			const endIndex = Math.min(startIndex + this.piecesPerPage, pieces.length);
			let hasUnplaced = false;

			for (let i = startIndex; i < endIndex; i++) {
				if (!this.gameState.isPiecePlaced(i)) {
					hasUnplaced = true;
					break;
				}
			}

			if (hasUnplaced) {
				this.currentPage = nextPage;
				break;
			}
		} while (attempts < maxPages);

		this.renderBottomPanel();
	}

	previousPage(): void {
		const pieces = this.gameState.getPieces();
		const maxPages = Math.ceil(pieces.length / this.piecesPerPage);

		if (maxPages <= 1) return;

		this.currentPage = (this.currentPage - 1 + maxPages) % maxPages;
		this.renderBottomPanel();
	}

	nextPage(): void {
		const pieces = this.gameState.getPieces();
		const maxPages = Math.ceil(pieces.length / this.piecesPerPage);

		if (maxPages <= 1) return;

		this.currentPage = (this.currentPage + 1) % maxPages;
		this.renderBottomPanel();
	}

	private checkAndAdvancePage(): void {
		const pieces = this.gameState.getPieces();
		const startIndex = this.currentPage * this.piecesPerPage;
		const endIndex = Math.min(startIndex + this.piecesPerPage, pieces.length);
		let allPlacedOnCurrentPage = true;
		for (let i = startIndex; i < endIndex; i++) {
			if (!this.gameState.isPiecePlaced(i)) {
				allPlacedOnCurrentPage = false;
				break;
			}
		}

		if (allPlacedOnCurrentPage) {
			this.morePieces();
		}
	}

	undo(): void {
		const undone = this.gameState.undo();
		if (undone) {
			this.achievementManager.trackUndo();
			this.updateUI();
			this.render();
			this.renderBottomPanel();
		}
	}

	redo(): void {
		const redone = this.gameState.redo();
		if (redone) {
			this.updateUI();
			this.render();
			this.renderBottomPanel();
		}
	}

	private clearHint(): void {
		this.hintPos = null;
		if (this.hintTimeout) {
			clearTimeout(this.hintTimeout);
			this.hintTimeout = null;
		}
	}

	toggleHint(): void {
		if (this.hintPos) {
			this.clearHint();
			this.render();
			return;
		}

		const hint = this.gameState.getSolutionHint();

		if (hint) {
			this.hintPos = hint;
			this.gameState.incrementHintCount();
			this.achievementManager.trackHint();
			this.render();

			this.hintTimeout = window.setTimeout(() => {
				this.hintPos = null;
				this.hintTimeout = null;
				this.render();
			}, 2000);
		}
	}

	restart(): void {
		this.gameState.restart();
		this.clearHint();
		this.achievementManager.resetInOrderTracking();

		(document.getElementById('solutionStatus') as HTMLElement).textContent = '';
		this.updateUI();
		this.render();
		this.renderBottomPanel();
	}

	startNewGame(): void {
		document.getElementById('victoryScreen')!.classList.add('hidden');
		showDifficultyScreen();
	}

	restartAndHideVictory(): void {
		document.getElementById('victoryScreen')!.classList.add('hidden');
		this.restart();
	}

	private checkWinCondition(): void {
		if (this.gameState.isGameWon()) {
			const victoryScreen = document.getElementById('victoryScreen')!;
			victoryScreen.classList.remove('hidden');

			const difficulty = this.gameState.getDifficulty();
			(document.getElementById('victoryDifficulty') as HTMLElement).textContent = difficulty;
			(document.getElementById('victoryUndos') as HTMLElement).textContent = this.gameState
				.getUndoCount()
				.toString();
			(document.getElementById('victoryHints') as HTMLElement).textContent = this.gameState
				.getHintCount()
				.toString();

			this.achievementManager.onGameComplete({
				difficulty: difficulty as DifficultyLevel,
				undoCount: this.gameState.getUndoCount(),
				hintCount: this.gameState.getHintCount(),
				moveCount: this.gameState.getMoveCount(),
				placedInOrder: this.achievementManager.isPlacedInOrder(),
			});
			const duration = 3000;
			const animationEnd = Date.now() + duration;
			const defaults = {startVelocity: 30, spread: 360, ticks: 60, zIndex: 2100};

			function randomInRange(min: number, max: number) {
				return Math.random() * (max - min) + min;
			}

			const interval = setInterval(function () {
				const timeLeft = animationEnd - Date.now();

				if (timeLeft <= 0) {
					return clearInterval(interval);
				}

				const particleCount = 50 * (timeLeft / duration);
				confetti({
					...defaults,
					particleCount,
					origin: {x: randomInRange(0.1, 0.3), y: Math.random() - 0.2},
					colors: ['#e94560', '#f39c12', '#3498db', '#2ecc71', '#9b59b6'],
				});
				confetti({
					...defaults,
					particleCount,
					origin: {x: randomInRange(0.7, 0.9), y: Math.random() - 0.2},
					colors: ['#e94560', '#f39c12', '#3498db', '#2ecc71', '#9b59b6'],
				});
			}, 250);

			const message = 'Congratulations! You solved it!';
			(document.getElementById('solutionStatus') as HTMLElement).textContent = message;
		}
	}

	private handleMouseMove(event: MouseEvent): void {
		if (this.isPanning) {
			const deltaX = event.clientX - this.panStartX;
			const deltaY = event.clientY - this.panStartY;
			this.panOffsetX = deltaX;
			this.panOffsetY = deltaY;
			this.render();
			return;
		}

		const canvas = this.canvasManager.getCanvas();
		const rect = canvas.getBoundingClientRect();
		const x = event.clientX - rect.left - canvas.width / 2 - this.panOffsetX;
		const y = event.clientY - rect.top - canvas.height / 2 - this.panOffsetY;

		const hex = this.renderer.pixelToHex(x, y);
		const grid = this.gameState.getGrid();
		if (grid.getHex(hex.q, hex.r)) {
			this.mouseHex = hex;
		} else {
			this.mouseHex = null;
		}

		this.render();
	}

	private handleMouseDown(event: MouseEvent): void {
		if (event.button === 0) {
			this.isPanning = true;
			this.panStartX = event.clientX - this.panOffsetX;
			this.panStartY = event.clientY - this.panOffsetY;
		}
	}

	private handleMouseUp(_event: MouseEvent): void {
		this.isPanning = false;
	}

	private lastWheelTime: number = 0;
	private consecutiveSmallDeltas: number = 0;
	private handleWheelEvent(event: WheelEvent): void {
		let normalizedDelta = event.deltaY;

		if (event.deltaMode === 1) {
			normalizedDelta *= 40;
		} else if (event.deltaMode === 2) {
			normalizedDelta *= 800;
		}

		const now = Date.now();
		const timeSinceLastWheel = now - this.lastWheelTime;
		const absDelta = Math.abs(normalizedDelta);

		const direction = Math.sign(normalizedDelta);

		if (direction === 0) return;

		if (absDelta < 4) {
			this.consecutiveSmallDeltas++;
		} else {
			this.consecutiveSmallDeltas = 0;
		}

		const isTrackpad = this.consecutiveSmallDeltas > 2;
		const minDelay = isTrackpad ? 200 : 120;

		if (timeSinceLastWheel >= minDelay || this.lastWheelTime === 0) {
			this.cyclePiece(direction);
			this.lastWheelTime = now;
		}
	}

	private handleTouchStart(event: TouchEvent): void {
		event.preventDefault();

		if (event.touches.length === 1) {
			const touch = event.touches[0];
			if (!touch) return;
			const canvas = this.canvasManager.getCanvas();
			const rect = canvas.getBoundingClientRect();
			const x = touch.clientX - rect.left - canvas.width / 2 - this.panOffsetX;
			const y = touch.clientY - rect.top - canvas.height / 2 - this.panOffsetY;

			const hex = this.renderer.pixelToHex(x, y);
			const grid = this.gameState.getGrid();
			if (grid.getHex(hex.q, hex.r)) {
				this.touchHex = hex;
				this.isTouching = true;
				this.render();
			}
		} else if (event.touches.length === 2) {
			this.touchHex = null;
			this.isTouching = false;

			const touch1 = event.touches[0];
			const touch2 = event.touches[1];
			if (!touch1 || !touch2) return;
			const dx = touch2.clientX - touch1.clientX;
			const dy = touch2.clientY - touch1.clientY;
			this.lastPinchDistance = Math.sqrt(dx * dx + dy * dy);
			const centerX = (touch1.clientX + touch2.clientX) / 2;
			const centerY = (touch1.clientY + touch2.clientY) / 2;
			this.panStartX = centerX - this.panOffsetX;
			this.panStartY = centerY - this.panOffsetY;
		}
	}

	private handleTouchMove(event: TouchEvent): void {
		event.preventDefault();

		if (event.touches.length === 1 && this.isTouching) {
			const touch = event.touches[0];
			if (!touch) return;
			const canvas = this.canvasManager.getCanvas();
			const rect = canvas.getBoundingClientRect();
			const x = touch.clientX - rect.left - canvas.width / 2 - this.panOffsetX;
			const y = touch.clientY - rect.top - canvas.height / 2 - this.panOffsetY;

			const hex = this.renderer.pixelToHex(x, y);
			const grid = this.gameState.getGrid();
			if (grid.getHex(hex.q, hex.r)) {
				this.touchHex = hex;
			} else {
				this.touchHex = null;
			}
			this.render();
		} else if (event.touches.length === 2) {
			const touch1 = event.touches[0];
			const touch2 = event.touches[1];
			if (!touch1 || !touch2) return;

			const dx = touch2.clientX - touch1.clientX;
			const dy = touch2.clientY - touch1.clientY;
			const newPinchDistance = Math.sqrt(dx * dx + dy * dy);
			if (this.lastPinchDistance !== null) {
				const scale = newPinchDistance / this.lastPinchDistance;
				this.zoom(scale);
			}
			this.lastPinchDistance = newPinchDistance;

			const centerX = (touch1.clientX + touch2.clientX) / 2;
			const centerY = (touch1.clientY + touch2.clientY) / 2;
			this.panOffsetX = centerX - this.panStartX;
			this.panOffsetY = centerY - this.panStartY;

			this.render();
		}
	}

	private handleTouchEnd(event: TouchEvent): void {
		event.preventDefault();

		if (event.touches.length === 0) {
			if (
				this.isTouching &&
				this.touchHex &&
				!this.gameState.isPiecePlaced(this.gameState.getCurrentPieceIndex())
			) {
				const piece = this.gameState.getCurrentPiece();
				if (this.canPlacePiece(piece, this.touchHex.q, this.touchHex.r)) {
					this.placePiece(this.touchHex.q, this.touchHex.r);
				} else {
					this.showInvalidPlacementFeedback(this.touchHex);
				}
			}

			this.touchHex = null;
			this.isTouching = false;
			this.lastPinchDistance = null;
			this.render();
		} else if (event.touches.length === 1) {
			this.lastPinchDistance = null;
		}
	}

	private handleTouchCancel(_event: TouchEvent): void {
		this.touchHex = null;
		this.isTouching = false;
		this.lastPinchDistance = null;
		this.render();
	}

	private handleClick(event: MouseEvent): void {
		if (this.isPanning) return;

		const canvas = this.canvasManager.getCanvas();
		const rect = canvas.getBoundingClientRect();
		const x = event.clientX - rect.left - canvas.width / 2 - this.panOffsetX;
		const y = event.clientY - rect.top - canvas.height / 2 - this.panOffsetY;

		const hex = this.renderer.pixelToHex(x, y);
		const grid = this.gameState.getGrid();
		if (grid.getHex(hex.q, hex.r) && !this.gameState.isPiecePlaced(this.gameState.getCurrentPieceIndex())) {
			const piece = this.gameState.getCurrentPiece();
			if (this.canPlacePiece(piece, hex.q, hex.r)) {
				this.placePiece(hex.q, hex.r);
			} else {
				this.showInvalidPlacementFeedback(hex);
			}
		}
	}

	private handleKeyPress(event: KeyboardEvent): void {
		switch (event.key) {
			case 'ArrowUp':
				event.preventDefault();
				this.cyclePiece(-1);
				break;
			case 'ArrowDown':
				event.preventDefault();
				this.cyclePiece(1);
				break;
			case 'ArrowLeft':
				event.preventDefault();
				this.undo();
				break;
			case 'ArrowRight':
				event.preventDefault();
				this.redo();
				break;
			case '+':
			case '=':
				this.zoom(1.1);
				break;
			case '-':
			case '_':
				this.zoom(0.9);
				break;
			case '?':
				this.toggleKeyboardShortcuts();
				break;
			case 'i':
			case 'I':
				showInstructions();
				break;
			case 'h':
			case 'H':
				this.toggleHint();
				break;
			case 'r':
			case 'R':
				this.resetView();
				break;
		}
	}

	private zoom(factor: number): void {
		const oldZoom = this.zoomFactor;
		this.zoomFactor = Math.max(0.5, Math.min(2.0, this.zoomFactor * factor));

		if (oldZoom !== this.zoomFactor) {
			this.updateCanvasSize();
			this.render();
		}
	}

	resetView(): void {
		this.zoomFactor = 1.0;
		this.panOffsetX = 0;
		this.panOffsetY = 0;
		this.updateCanvasSize();
		this.render();
	}

	resetGame(): void {
		while (this.gameState.canUndo()) {
			this.gameState.undo();
		}
		this.clearHint();
		this.updateUI();
		this.render();
		this.renderBottomPanel();
	}

	private showInvalidPlacementFeedback(position: HexCoordinate): void {
		this.invalidPlacementAnimation = {
			isActive: true,
			startTime: performance.now(),
			position: position,
			duration: 333,
		};
		this.requestAnimationFrame();
	}

	private toggleKeyboardShortcuts(): void {
		const modal = document.getElementById('keyboardShortcutsModal');
		if (modal) {
			modal.classList.toggle('hidden');
		}
	}

	private updateUI(): void {
		if (!this.gameState.getAllPiecesPlaced()) {
			(document.getElementById('solutionStatus') as HTMLElement).textContent = '';
		}

		const undoBtn = document.getElementById('undoBtn') as HTMLButtonElement;
		const redoBtn = document.getElementById('redoBtn') as HTMLButtonElement;

		if (undoBtn) {
			undoBtn.disabled = !this.gameState.canUndo();
		}

		if (redoBtn) {
			redoBtn.disabled = !this.gameState.canRedo();
		}

		this.renderBottomPanel();
	}

	private render(): void {
		const canvas = this.canvasManager.getCanvas();
		const ctx = this.canvasManager.getContext();

		this.canvasManager.clearCanvas('#0f3460');

		ctx.save();
		ctx.translate(canvas.width / 2 + this.panOffsetX, canvas.height / 2 + this.panOffsetY);

		const fontSize = Math.max(12, Math.floor(this.renderer.hexSize * 0.5));
		const grid = this.gameState.getGrid();

		grid.hexes.forEach((hex) => {
			const pos = this.renderer.hexToPixel(hex.q, hex.r);
			let displayHeight = hex.height;

			const animatingHex = this.animatingHexes.find((h) => h.q === hex.q && h.r === hex.r);
			if (animatingHex) {
				displayHeight = animatingHex.targetHeight;
			}

			const color = this.colors[displayHeight] || (displayHeight > 10 ? '#1a1a1a' : '#000');
			this.drawHex(ctx, pos.x, pos.y, color, '#0f3460', 2);

			if (displayHeight > 0) {
				ctx.fillStyle = '#fff';
				ctx.font = `bold ${fontSize}px Arial`;
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.fillText(displayHeight.toString(), pos.x, pos.y);
			}
		});

		this.animatingHexes.forEach((animatingHex) => {
			const hex = grid.getHex(animatingHex.q, animatingHex.r);
			if (!hex) return;

			const pos = this.renderer.hexToPixel(hex.q, hex.r);

			ctx.save();
			ctx.translate(pos.x, pos.y);

			const burstScale = 1 + animatingHex.progress * 0.5;
			const opacity = 1 - animatingHex.progress;

			ctx.globalAlpha = opacity;
			ctx.scale(burstScale, burstScale);

			this.canvasManager.drawHexOnCanvas(
				ctx,
				0,
				0,
				this.renderer.hexSize,
				this.colors[animatingHex.startHeight] || (animatingHex.startHeight > 10 ? '#1a1a1a' : '#000'),
				'#0f3460',
				2,
			);

			if (animatingHex.startHeight > 0 && opacity > 0.1) {
				ctx.fillStyle = '#fff';
				ctx.font = `bold ${fontSize}px Arial`;
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.fillText(animatingHex.startHeight.toString(), 0, 0);
			}

			ctx.restore();
		});

		if (this.isDragging && this.draggedPieceIndex !== null && this.dragHoverHex) {
			const piece = this.gameState.getPieceByIndex(this.draggedPieceIndex);
			if (piece) {
				const canPlace = this.canPlacePiece(piece, this.dragHoverHex.q, this.dragHoverHex.r);

				piece.tiles.forEach((tile) => {
					const adjustedQ = this.dragHoverHex!.q + tile.q - piece.center.q;
					const adjustedR = this.dragHoverHex!.r + tile.r - piece.center.r;
					const hex = grid.getHex(adjustedQ, adjustedR);
					if (hex) {
						const pos = this.renderer.hexToPixel(hex.q, hex.r);
						if (canPlace) {
							this.drawHaloEffect(ctx, pos.x, pos.y);
						}
					}
				});
			}
		}

		const previewHex = this.mouseHex || this.touchHex;
		if (previewHex && !this.gameState.isPiecePlaced(this.gameState.getCurrentPieceIndex()) && !this.isDragging) {
			const piece = this.gameState.getCurrentPiece();
			const canPlace = this.canPlacePiece(piece, previewHex.q, previewHex.r);

			piece.tiles.forEach((tile) => {
				const adjustedQ = previewHex.q + tile.q - piece.center.q;
				const adjustedR = previewHex.r + tile.r - piece.center.r;
				const hex = grid.getHex(adjustedQ, adjustedR);
				if (hex) {
					const pos = this.renderer.hexToPixel(hex.q, hex.r);
					if (canPlace) {
						this.drawHex(ctx, pos.x, pos.y, 'rgba(255, 235, 59, 0.3)', '#ffeb3b', 3);
					} else {
						this.drawHex(ctx, pos.x, pos.y, 'rgba(244, 67, 54, 0.3)', '#f44336', 3);
					}
				}
			});
		}

		if (this.hintPos) {
			const piece = this.gameState.getCurrentPiece();
			piece.tiles.forEach((tile) => {
				const adjustedQ = this.hintPos!.q + tile.q - piece.center.q;
				const adjustedR = this.hintPos!.r + tile.r - piece.center.r;
				const hex = grid.getHex(adjustedQ, adjustedR);
				if (hex) {
					const pos = this.renderer.hexToPixel(hex.q, hex.r);
					ctx.strokeStyle = '#e94560';
					ctx.lineWidth = 4;
					ctx.setLineDash([5, 5]);
					this.drawHexOutline(ctx, pos.x, pos.y);
					ctx.setLineDash([]);
				}
			});
		}

		if (this.invalidPlacementAnimation && this.invalidPlacementAnimation.isActive) {
			const elapsed = performance.now() - this.invalidPlacementAnimation.startTime;
			const progress = elapsed / this.invalidPlacementAnimation.duration;

			const pulseProgress = Math.sin(progress * Math.PI * 2);
			const scale = 1.0 + pulseProgress * 0.3;
			const opacity = Math.max(0, 1 - progress);

			const piece = this.gameState.getCurrentPiece();
			piece.tiles.forEach((tile) => {
				const adjustedQ = this.invalidPlacementAnimation!.position.q + tile.q - piece.center.q;
				const adjustedR = this.invalidPlacementAnimation!.position.r + tile.r - piece.center.r;
				const hex = grid.getHex(adjustedQ, adjustedR);
				if (hex) {
					const pos = this.renderer.hexToPixel(hex.q, hex.r);

					ctx.save();
					ctx.translate(pos.x, pos.y);
					ctx.scale(scale, scale);
					ctx.globalAlpha = opacity;
					ctx.strokeStyle = '#f44336';
					ctx.lineWidth = 5;
					this.drawHexOutline(ctx, 0, 0);
					ctx.restore();
				}
			});
		}

		ctx.restore();
	}

	private renderBottomPanel(): void {
		const piecesContainer = document.getElementById('piecesContainer');
		if (!piecesContainer) return;

		piecesContainer.innerHTML = '';

		const pieces = this.gameState.getPieces();
		const startIndex = this.currentPage * this.piecesPerPage;
		const endIndex = Math.min(startIndex + this.piecesPerPage, pieces.length);

		for (let i = startIndex; i < endIndex; i++) {
			const piece = pieces[i];
			const isPlaced = this.gameState.isPiecePlaced(i);

			const pieceContainer = document.createElement('div');
			pieceContainer.className = `draggable-piece ${isPlaced ? 'empty-slot' : ''}`;
			pieceContainer.dataset['pieceIndex'] = i.toString();

			if (!piece) continue;
			const svg = this.createPieceSVG(piece, isPlaced);
			pieceContainer.appendChild(svg);

			if (!isPlaced) {
				this.setupPieceDragHandlers(pieceContainer, i);
			}

			piecesContainer.appendChild(pieceContainer);
		}

		const morePiecesBtn = document.getElementById('morePiecesBtn') as HTMLButtonElement;
		if (morePiecesBtn) {
			const totalPages = Math.ceil(pieces.length / this.piecesPerPage);

			if (totalPages <= 1) {
				morePiecesBtn.disabled = true;
			} else {
				let hasUnplacedOnOtherPages = false;

				for (let page = 0; page < totalPages; page++) {
					if (page === this.currentPage) continue;

					const pageStart = page * this.piecesPerPage;
					const pageEnd = Math.min(pageStart + this.piecesPerPage, pieces.length);

					for (let i = pageStart; i < pageEnd; i++) {
						if (!this.gameState.isPiecePlaced(i)) {
							hasUnplacedOnOtherPages = true;
							break;
						}
					}

					if (hasUnplacedOnOtherPages) break;
				}

				morePiecesBtn.disabled = !hasUnplacedOnOtherPages;
			}
		}
	}

	private createPieceSVG(piece: Piece, isPlaced: boolean): SVGElement {
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.setAttribute('viewBox', '-50 -50 100 100');
		svg.style.width = '100%';
		svg.style.height = '100%';
		svg.style.display = 'block';

		if (!isPlaced) {
			piece.tiles.forEach((tile) => {
				const adjustedQ = tile.q - piece.center.q;
				const adjustedR = tile.r - piece.center.r;
				const x = 15 * ((3 / 2) * adjustedQ);
				const y = 15 * ((Math.sqrt(3) / 2) * adjustedQ + Math.sqrt(3) * adjustedR);

				const hex = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
				const points = [];
				for (let i = 0; i < 6; i++) {
					const angle = (Math.PI / 3) * i;
					const hx = x + 15 * Math.cos(angle);
					const hy = y + 15 * Math.sin(angle);
					points.push(`${hx},${hy}`);
				}
				hex.setAttribute('points', points.join(' '));
				hex.setAttribute('fill', 'rgba(233, 69, 96, 0.1)');
				hex.setAttribute('stroke', '#e94560');
				hex.setAttribute('stroke-width', '2');

				svg.appendChild(hex);
			});
		}

		return svg;
	}

	private renderFullSizePieceOnCanvas(canvas: HTMLCanvasElement, piece: Piece): void {
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		const hexSize = this.renderer.hexSize;

		ctx.save();
		ctx.translate(canvas.width / 2, canvas.height / 2);

		piece.tiles.forEach((tile) => {
			const adjustedQ = tile.q - piece.center.q;
			const adjustedR = tile.r - piece.center.r;
			const x = hexSize * ((3 / 2) * adjustedQ);
			const y = hexSize * ((Math.sqrt(3) / 2) * adjustedQ + Math.sqrt(3) * adjustedR);

			this.drawTransparentPieceHex(ctx, x, y, hexSize);
		});

		ctx.restore();
	}

	private drawTransparentPieceHex(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
		ctx.beginPath();
		for (let i = 0; i < 6; i++) {
			const angle = (Math.PI / 3) * i;
			const hx = x + size * Math.cos(angle);
			const hy = y + size * Math.sin(angle);
			if (i === 0) {
				ctx.moveTo(hx, hy);
			} else {
				ctx.lineTo(hx, hy);
			}
		}
		ctx.closePath();

		ctx.fillStyle = 'rgba(233, 69, 96, 0.1)';
		ctx.fill();
		ctx.strokeStyle = '#e94560';
		ctx.lineWidth = 2;
		ctx.stroke();
	}

	private createDragPreview(pieceIndex: number, clientX: number, clientY: number): void {
		const piece = this.gameState.getPieceByIndex(pieceIndex);
		if (!piece) return;

		const hexSize = this.renderer.hexSize;
		const minQ = Math.min(...piece.tiles.map((tile) => tile.q - piece.center.q));
		const maxQ = Math.max(...piece.tiles.map((tile) => tile.q - piece.center.q));
		const minR = Math.min(...piece.tiles.map((tile) => tile.r - piece.center.r));
		const maxR = Math.max(...piece.tiles.map((tile) => tile.r - piece.center.r));

		const hexWidth = hexSize * (3 / 2);
		const hexHeight = hexSize * Math.sqrt(3);

		const canvasWidth = (maxQ - minQ + 1) * hexWidth + hexSize;
		const canvasHeight = (maxR - minR + 1) * hexHeight + hexSize;

		const preview = document.createElement('div');
		preview.className = 'drag-preview';
		preview.style.position = 'fixed';
		preview.style.pointerEvents = 'none';
		preview.style.zIndex = '10000';
		preview.style.left = `${clientX - canvasWidth / 2}px`;
		preview.style.top = `${clientY - canvasHeight / 2}px`;

		const canvas = document.createElement('canvas');
		canvas.width = canvasWidth;
		canvas.height = canvasHeight;
		preview.appendChild(canvas);

		this.renderFullSizePieceOnCanvas(canvas, piece);

		document.body.appendChild(preview);
		this.dragPreviewElement = preview;
	}

	private setupPieceDragHandlers(element: HTMLElement, pieceIndex: number): void {
		element.addEventListener('mousedown', (e) => this.handlePieceDragStart(e, pieceIndex));

		element.addEventListener('touchstart', (e) => this.handlePieceTouchStart(e, pieceIndex), {passive: false});
	}

	private handlePieceDragStart(event: MouseEvent, pieceIndex: number): void {
		event.preventDefault();
		this.startDrag(pieceIndex, event.clientX, event.clientY, event.target as HTMLElement);
	}

	private handlePieceTouchStart(event: TouchEvent, pieceIndex: number): void {
		if (this.isSwipingPanel) {
			return;
		}

		event.preventDefault();
		if (event.touches.length === 1) {
			const touch = event.touches[0];
			if (!touch) return;
			this.startDrag(pieceIndex, touch.clientX, touch.clientY, event.target as HTMLElement);
		}
	}

	private startDrag(pieceIndex: number, clientX: number, clientY: number, element: HTMLElement): void {
		if (this.gameState.isPiecePlaced(pieceIndex)) return;

		this.isDragging = true;
		this.draggedPieceIndex = pieceIndex;
		this.draggedPieceElement = element.closest('.draggable-piece') as HTMLElement;

		if (this.draggedPieceElement) {
			this.draggedPieceElement.classList.add('dragging');
		}

		this.createDragPreview(pieceIndex, clientX, clientY);

		document.addEventListener('mousemove', this.handleGlobalDragMove);
		document.addEventListener('mouseup', this.handleGlobalDragEnd);
		document.addEventListener('touchmove', this.handleGlobalTouchMove, {passive: false});
		document.addEventListener('touchend', this.handleGlobalTouchEnd);
	}

	private handleGlobalDragMove = (event: MouseEvent): void => {
		if (!this.isDragging) return;
		event.preventDefault();
		this.updateDragPosition(event.clientX, event.clientY);
	};

	private handleGlobalTouchMove = (event: TouchEvent): void => {
		if (!this.isDragging) return;
		event.preventDefault();
		if (event.touches.length === 1) {
			const touch = event.touches[0];
			if (!touch) return;
			this.updateDragPosition(touch.clientX, touch.clientY);
		}
	};

	private updateDragPosition(clientX: number, clientY: number): void {
		if (this.dragPreviewElement) {
			const canvas = this.dragPreviewElement.querySelector('canvas');
			if (canvas) {
				const halfWidth = canvas.width / 2;
				const halfHeight = canvas.height / 2;
				this.dragPreviewElement.style.left = `${clientX - halfWidth}px`;
				this.dragPreviewElement.style.top = `${clientY - halfHeight}px`;
			}
		}

		const canvas = this.canvasManager.getCanvas();
		const rect = canvas.getBoundingClientRect();

		if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
			const x = clientX - rect.left - canvas.width / 2 - this.panOffsetX;
			const y = clientY - rect.top - canvas.height / 2 - this.panOffsetY;

			const hex = this.renderer.pixelToHex(x, y);
			const grid = this.gameState.getGrid();
			if (grid.getHex(hex.q, hex.r)) {
				this.dragHoverHex = hex;
			} else {
				this.dragHoverHex = null;
			}
		} else {
			this.dragHoverHex = null;
		}

		this.render();
	}

	private handleGlobalDragEnd = (_event: MouseEvent): void => {
		if (!this.isDragging) return;
		this.finishDrag();
	};

	private handleGlobalTouchEnd = (_event: TouchEvent): void => {
		if (!this.isDragging) return;
		this.finishDrag();
	};

	private finishDrag(): void {
		if (!this.isDragging || this.draggedPieceIndex === null) return;

		if (this.dragHoverHex) {
			const piece = this.gameState.getPieceByIndex(this.draggedPieceIndex);
			if (piece && this.canPlacePiece(piece, this.dragHoverHex.q, this.dragHoverHex.r)) {
				this.gameState.setCurrentPieceIndex(this.draggedPieceIndex);
				this.placePiece(this.dragHoverHex.q, this.dragHoverHex.r);
			} else if (piece) {
				this.showInvalidPlacementFeedback(this.dragHoverHex);
			}
		}

		if (this.draggedPieceElement) {
			this.draggedPieceElement.classList.remove('dragging');
		}

		if (this.dragPreviewElement) {
			document.body.removeChild(this.dragPreviewElement);
			this.dragPreviewElement = null;
		}

		this.isDragging = false;
		this.draggedPieceIndex = null;
		this.draggedPieceElement = null;
		this.dragHoverHex = null;

		document.removeEventListener('mousemove', this.handleGlobalDragMove);
		document.removeEventListener('mouseup', this.handleGlobalDragEnd);
		document.removeEventListener('touchmove', this.handleGlobalTouchMove);
		document.removeEventListener('touchend', this.handleGlobalTouchEnd);

		this.render();
	}

	private renderPieceNavigation(): void {
		this.renderPieceNavigationCanvas('prevPiece', this.gameState.getPreviousPieceIndex());
		this.renderPieceNavigationCanvas('nextPiece', this.gameState.getNextPieceIndex());
		this.renderPieceNavigationCanvas('mobilePrevPiece', this.gameState.getPreviousPieceIndex());
		this.renderPieceNavigationCanvas('mobileNextPiece', this.gameState.getNextPieceIndex());
	}

	private renderPieceNavigationCanvas(canvasId: string, pieceIndex: number | null): void {
		const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
		if (!canvas) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const parent = canvas.parentElement;
		if (!parent) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		if (pieceIndex === null) {
			parent.classList.add('disabled');
			ctx.fillStyle = '#333';
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			return;
		}

		parent.classList.remove('disabled');

		const piece = this.gameState.getPieceByIndex(pieceIndex);
		if (!piece) return;

		const previewHexSize = Math.min(canvas.width, canvas.height) / 8;

		ctx.save();
		ctx.translate(canvas.width / 2, canvas.height / 2);

		const color = this.gameState.isPiecePlaced(pieceIndex) ? '#666' : '#e94560';

		piece.tiles.forEach((tile) => {
			const adjustedQ = tile.q - piece.center.q;
			const adjustedR = tile.r - piece.center.r;
			const x = previewHexSize * ((3 / 2) * adjustedQ);
			const y = previewHexSize * ((Math.sqrt(3) / 2) * adjustedQ + Math.sqrt(3) * adjustedR);
			this.drawPieceNavigationHex(ctx, x, y, previewHexSize, color);
		});

		ctx.restore();
	}

	private drawPieceNavigationHex(
		ctx: CanvasRenderingContext2D,
		x: number,
		y: number,
		size: number,
		color: string,
	): void {
		ctx.beginPath();
		for (let i = 0; i < 6; i++) {
			const angle = (Math.PI / 3) * i;
			const hx = x + size * Math.cos(angle);
			const hy = y + size * Math.sin(angle);
			if (i === 0) {
				ctx.moveTo(hx, hy);
			} else {
				ctx.lineTo(hx, hy);
			}
		}
		ctx.closePath();
		ctx.fillStyle = color;
		ctx.fill();
		ctx.strokeStyle = '#0f3460';
		ctx.lineWidth = 1;
		ctx.stroke();
	}

	private drawHex(
		ctx: CanvasRenderingContext2D,
		x: number,
		y: number,
		fillColor: string,
		strokeColor: string,
		lineWidth: number,
	): void {
		this.canvasManager.drawHexOnCanvas(ctx, x, y, this.renderer.hexSize, fillColor, strokeColor, lineWidth);
	}

	private drawHexOutline(ctx: CanvasRenderingContext2D, x: number, y: number): void {
		ctx.beginPath();
		for (let i = 0; i < 6; i++) {
			const angle = (Math.PI / 3) * i;
			const hx = x + this.renderer.hexSize * Math.cos(angle);
			const hy = y + this.renderer.hexSize * Math.sin(angle);
			if (i === 0) {
				ctx.moveTo(hx, hy);
			} else {
				ctx.lineTo(hx, hy);
			}
		}
		ctx.closePath();
		ctx.stroke();
	}

	private drawHaloEffect(ctx: CanvasRenderingContext2D, x: number, y: number): void {
		ctx.save();

		ctx.beginPath();
		for (let i = 0; i < 6; i++) {
			const angle = (Math.PI / 3) * i;
			const hx = x + this.renderer.hexSize * Math.cos(angle);
			const hy = y + this.renderer.hexSize * Math.sin(angle);
			if (i === 0) {
				ctx.moveTo(hx, hy);
			} else {
				ctx.lineTo(hx, hy);
			}
		}
		ctx.closePath();
		ctx.fillStyle = 'rgba(255, 235, 59, 0.2)';
		ctx.fill();

		const glowSize = this.renderer.hexSize * 1.3;
		ctx.beginPath();
		for (let i = 0; i < 6; i++) {
			const angle = (Math.PI / 3) * i;
			const hx = x + glowSize * Math.cos(angle);
			const hy = y + glowSize * Math.sin(angle);
			if (i === 0) {
				ctx.moveTo(hx, hy);
			} else {
				ctx.lineTo(hx, hy);
			}
		}
		ctx.closePath();

		const gradient = ctx.createRadialGradient(x, y, this.renderer.hexSize, x, y, glowSize);
		gradient.addColorStop(0, 'rgba(255, 235, 59, 0.3)');
		gradient.addColorStop(1, 'rgba(255, 235, 59, 0.0)');

		ctx.fillStyle = gradient;
		ctx.fill();

		ctx.restore();
	}

	private requestAnimationFrame(): void {
		if (
			(this.animationStartTime !== null && this.animatingHexes.length > 0) ||
			(this.invalidPlacementAnimation && this.invalidPlacementAnimation.isActive)
		) {
			requestAnimationFrame(() => this.animate());
		}
	}

	private handlePiecePlacementAnimation(now: number): boolean {
		if (this.animationStartTime === null) {
			return false;
		}

		const elapsed = now - this.animationStartTime;
		const progress = Math.min(elapsed / this.animationDuration, 1);

		const easeInOutCubic = (t: number): number => {
			return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
		};

		this.animatingHexes.forEach((hex) => {
			const hexElapsed = Math.max(0, elapsed - hex.delay);
			const hexProgress = Math.min(hexElapsed / 400, 1);
			const easedHexProgress = easeInOutCubic(hexProgress);
			hex.progress = easedHexProgress;
		});

		if (progress < 1) {
			return true;
		} else {
			this.animatingHexes = [];
			this.animationStartTime = null;
			return false;
		}
	}

	private handleInvalidPlacementAnimation(now: number): boolean {
		if (!this.invalidPlacementAnimation || !this.invalidPlacementAnimation.isActive) {
			return false;
		}

		const elapsed = now - this.invalidPlacementAnimation.startTime;
		if (elapsed >= this.invalidPlacementAnimation.duration) {
			this.invalidPlacementAnimation = null;
			return false;
		} else {
			return true;
		}
	}

	private animate(): void {
		const now = performance.now();
		let needsMoreFrames = false;

		needsMoreFrames = this.handlePiecePlacementAnimation(now) || needsMoreFrames;
		needsMoreFrames = this.handleInvalidPlacementAnimation(now) || needsMoreFrames;

		this.render();

		if (needsMoreFrames) {
			this.requestAnimationFrame();
		}
	}
}

window.startGame = startGame;
window.startCustomGame = startCustomGame;
window.showDifficultyScreen = showDifficultyScreen;
window.showInstructions = showInstructions;
window.game = game;

export {};
