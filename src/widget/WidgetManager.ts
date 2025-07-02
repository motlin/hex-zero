import {Widget, type WidgetData} from '../plugins/widget-plugin';
import {type AchievementStats} from '../achievements/AchievementStorage';
import {Capacitor} from '@capacitor/core';

export class WidgetManager {
	private static instance: WidgetManager;
	private currentStreak: number = 0;
	private lastWinDate: Date | null = null;

	private constructor() {}

	static getInstance(): WidgetManager {
		if (!WidgetManager.instance) {
			WidgetManager.instance = new WidgetManager();
		}
		return WidgetManager.instance;
	}

	async updateFromStats(stats: AchievementStats): Promise<void> {
		if (!Capacitor.isNativePlatform()) {
			return;
		}

		const widgetData: WidgetData = {
			gamesPlayed: stats.gamesPlayed,
			gamesWon: stats.gamesWon,
			currentStreak: this.currentStreak,
			lastPlayed: Date.now(),
		};

		try {
			await Widget.updateWidgetData(widgetData);
		} catch (error) {
			console.error('Failed to update widget data:', error);
		}
	}

	updateStreak(won: boolean): void {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		if (won) {
			if (this.lastWinDate) {
				const lastWin = new Date(this.lastWinDate);
				lastWin.setHours(0, 0, 0, 0);

				const daysDiff = Math.floor((today.getTime() - lastWin.getTime()) / (1000 * 60 * 60 * 24));

				if (daysDiff === 1) {
					this.currentStreak++;
				} else if (daysDiff === 0) {
					// Same day win - maintain streak
				} else {
					this.currentStreak = 1;
				}
			} else {
				this.currentStreak = 1;
			}

			this.lastWinDate = new Date();
		}
	}

	getStreak(): number {
		return this.currentStreak;
	}

	// Load streak data from storage
	loadStreakData(data: {currentStreak?: number; lastWinDate?: string}): void {
		if (data.currentStreak !== undefined) {
			this.currentStreak = data.currentStreak;
		}
		if (data.lastWinDate) {
			this.lastWinDate = new Date(data.lastWinDate);
		}
	}

	getStreakData(): {currentStreak: number; lastWinDate: string | null} {
		return {
			currentStreak: this.currentStreak,
			lastWinDate: this.lastWinDate ? this.lastWinDate.toISOString() : null,
		};
	}
}
