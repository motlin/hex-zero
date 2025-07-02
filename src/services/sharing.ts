import {Share} from '@capacitor/share';
import {Capacitor} from '@capacitor/core';
import type {GameDifficulty} from '../state/GameState';

// Temporary type definitions until proper imports are available
type GameStats = {
	gamesWon: number;
	gamesLost: number;
	bestTime?: number;
	bestMoves?: number;
	currentStreak: number;
};

/**
 * 🎯 Service for sharing game achievements and stats
 */
export class SharingService {
	private static instance: SharingService | undefined;

	private constructor() {}

	static getInstance(): SharingService {
		SharingService.instance ??= new SharingService();
		return SharingService.instance;
	}

	/**
	 * Share victory message when completing a puzzle
	 */
	async shareVictory(
		difficulty: GameDifficulty,
		moveCount: number,
		timeInSeconds: number,
		isNewRecord: boolean = false,
	): Promise<void> {
		const timeStr = this.formatTime(timeInSeconds);
		const difficultyEmoji = this.getDifficultyEmoji(difficulty);

		const title = `Hex Zero Victory! ${difficultyEmoji}`;
		let text = `I just completed a ${difficulty} Hex Zero puzzle in ${moveCount} moves and ${timeStr}!`;

		if (isNewRecord) {
			text += ' 🏆 New personal record!';
		}

		await this.share({
			title,
			text,
			dialogTitle: 'Share your victory!',
		});
	}

	/**
	 * Share overall game statistics
	 */
	async shareStats(stats: GameStats): Promise<void> {
		const totalGames = stats.gamesWon + stats.gamesLost;
		const winRate = totalGames > 0 ? Math.round((stats.gamesWon / totalGames) * 100) : 0;

		const title = 'My Hex Zero Stats 📊';
		const text =
			'Hex Zero Stats:\n' +
			`🎮 Games Played: ${totalGames}\n` +
			`✅ Games Won: ${stats.gamesWon}\n` +
			`📈 Win Rate: ${winRate}%\n` +
			`⏱️ Best Time: ${this.formatTime(stats.bestTime ?? 0)}\n` +
			`🎯 Fewest Moves: ${stats.bestMoves ?? 'N/A'}\n` +
			`🔥 Current Streak: ${stats.currentStreak}`;

		await this.share({
			title,
			text,
			dialogTitle: 'Share your stats!',
		});
	}

	/**
	 * Share a specific achievement
	 */
	async shareAchievement(achievement: string, description: string): Promise<void> {
		const title = '🏆 Hex Zero Achievement Unlocked!';
		const text = `I just unlocked "${achievement}" in Hex Zero!\n${description}`;

		await this.share({
			title,
			text,
			dialogTitle: 'Share your achievement!',
		});
	}

	/**
	 * Share game invitation
	 */
	async shareGameInvite(): Promise<void> {
		const title = 'Try Hex Zero! 🎮';
		const text = 'Check out Hex Zero - a challenging hexagonal puzzle game! Can you match all the tiles?';
		// Replace with actual URL when available
		const url = 'https://hex-zero.com';

		await this.share({
			title,
			text,
			url,
			dialogTitle: 'Invite friends to play!',
		});
	}

	/**
	 * Core sharing method with platform checks
	 */
	private async share(options: {title?: string; text?: string; url?: string; dialogTitle?: string}): Promise<void> {
		// Check if sharing is available
		if (!Capacitor.isNativePlatform()) {
			// Web fallback - use Web Share API if available
			if (typeof navigator.share === 'function') {
				try {
					const shareData: ShareData = {};
					if (options.title !== undefined && options.title !== '') shareData.title = options.title;
					if (options.text !== undefined && options.text !== '') shareData.text = options.text;
					if (options.url !== undefined && options.url !== '') shareData.url = options.url;
					await navigator.share(shareData);
				} catch (error) {
					// User cancelled or error occurred
					if (error instanceof Error && error.name !== 'AbortError') {
						console.error('Web Share API error:', error);
					}
				}
			} else {
				// Fallback to copying to clipboard
				const shareText = [options.title, options.text, options.url]
					.filter((value): value is string => value !== undefined && value !== '')
					.join('\n\n');
				await navigator.clipboard.writeText(shareText);
			}
			return;
		}

		// Native sharing
		try {
			const canShare = await Share.canShare();
			if (!canShare.value) {
				console.warn('Sharing is not available on this device');
				return;
			}

			const shareOptions: import('@capacitor/share').ShareOptions = {};
			if (options.title !== undefined && options.title !== '') shareOptions.title = options.title;
			if (options.text !== undefined && options.text !== '') shareOptions.text = options.text;
			if (options.url !== undefined && options.url !== '') shareOptions.url = options.url;
			if (options.dialogTitle !== undefined && options.dialogTitle !== '') {
				shareOptions.dialogTitle = options.dialogTitle;
			}
			await Share.share(shareOptions);
		} catch (error) {
			// User cancelled or error occurred
			if (error instanceof Error && error.message !== 'Share canceled') {
				console.error('Native sharing error:', error);
			}
		}
	}

	/**
	 * Format time in MM:SS or HH:MM:SS format
	 */
	private formatTime(seconds: number): string {
		if (seconds === 0) return '0:00';

		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = Math.floor(seconds % 60);

		if (hours > 0) {
			return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
		}
		return `${minutes}:${secs.toString().padStart(2, '0')}`;
	}

	/**
	 * Get emoji for difficulty level
	 */
	private getDifficultyEmoji(difficulty: GameDifficulty): string {
		switch (difficulty) {
			case 'Easy':
				return '🟢';
			case 'Medium':
				return '🟡';
			case 'Hard':
				return '🔴';
			case 'Extreme':
			case 'Impossible':
				return '🟣';
			case 'Custom':
				return '🎮';
			default:
				return difficulty satisfies never;
		}
	}
}
