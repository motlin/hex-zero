import {AchievementId, ACHIEVEMENTS, DifficultyLevel} from './AchievementDefinitions';
import {AchievementStorage, AchievementSaveData} from './AchievementStorage';
import {AchievementUI} from './AchievementUI';

export interface GameCompletionData {
	difficulty: DifficultyLevel;
	undoCount: number;
	hintCount: number;
	moveCount: number;
	placedInOrder: boolean;
}

export class AchievementManager {
	private data: AchievementSaveData;
	private ui: AchievementUI;
	private unlockedThisSession: Set<AchievementId> = new Set();
	private checkInOrderProgress: number[] = [];
	private placedInOrder: boolean = true;

	constructor() {
		this.data = AchievementStorage.load();
		this.ui = new AchievementUI();
	}

	initialize(): void {
		this.ui.initialize();
		this.updateAchievementButton();
	}

	resetInOrderTracking(): void {
		this.checkInOrderProgress = [];
		this.placedInOrder = true;
	}

	trackPiecePlaced(pieceIndex: number): void {
		if (this.placedInOrder) {
			this.checkInOrderProgress.push(pieceIndex);
			// Check if pieces are being placed in order (0, 1, 2, 3, ...)
			const expectedIndex = this.checkInOrderProgress.length - 1;
			if (pieceIndex !== expectedIndex) {
				this.placedInOrder = false;
			}
		}
	}

	trackUndo(): void {
		this.data.stats.totalUndos++;
		if (this.placedInOrder && this.checkInOrderProgress.length > 0) {
			// Remove the last placed piece from tracking
			this.checkInOrderProgress.pop();
		}
	}

	trackGameStart(): void {
		this.data.stats.gamesPlayed++;
		this.resetInOrderTracking();
		AchievementStorage.save(this.data);
	}

	trackMove(): void {
		this.data.stats.totalMoves++;
	}

	trackHint(): void {
		this.data.stats.totalHints++;
	}

	onGameComplete(completionData: GameCompletionData): void {
		this.data.stats.gamesWon++;
		this.data.stats.winsByDifficulty[completionData.difficulty] =
			(this.data.stats.winsByDifficulty[completionData.difficulty] || 0) + 1;

		const newAchievements: AchievementId[] = [];

		const difficultyLower = completionData.difficulty.toLowerCase();

		const baseAchievementId = `beat_${difficultyLower}` as AchievementId;
		if (this.unlockAchievement(baseAchievementId)) {
			newAchievements.push(baseAchievementId);
		}

		if (completionData.undoCount === 0) {
			const noUndoAchievementId = `beat_${difficultyLower}_no_undo` as AchievementId;
			if (this.unlockAchievement(noUndoAchievementId)) {
				newAchievements.push(noUndoAchievementId);
			}
		}

		if (this.placedInOrder) {
			const inOrderAchievementId = `beat_${difficultyLower}_in_order` as AchievementId;
			if (this.unlockAchievement(inOrderAchievementId)) {
				newAchievements.push(inOrderAchievementId);
			}
		}

		AchievementStorage.save(this.data);

		if (newAchievements.length > 0) {
			this.ui.showUnlockNotifications(newAchievements);
		}

		this.updateAchievementButton();
	}

	private unlockAchievement(id: AchievementId): boolean {
		if (!this.data.achievements[id] || !this.data.achievements[id].unlocked) {
			this.data.achievements[id] = {
				unlocked: true,
				unlockedAt: Date.now(),
			};
			this.unlockedThisSession.add(id);
			return true;
		}
		return false;
	}

	showAchievements(): void {
		this.ui.showAchievementsModal(this.data.achievements, this.data.stats);
	}

	getUnlockedCount(): number {
		return Object.values(this.data.achievements).filter((a) => a.unlocked).length;
	}

	getTotalCount(): number {
		return Object.keys(ACHIEVEMENTS).length;
	}

	private updateAchievementButton(): void {
		const count = this.getUnlockedCount();
		const total = this.getTotalCount();
		const text = `🏆 Achievements (${count}/${total})`;

		// Update game screen button
		const button = document.getElementById('achievementsButton');
		if (button) {
			button.textContent = text;
		}

		// Update menu screen button
		const menuButton = document.getElementById('menuAchievementsButton');
		if (menuButton) {
			menuButton.textContent = text;
		}
	}

	isPlacedInOrder(): boolean {
		return this.placedInOrder;
	}
}
