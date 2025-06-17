import {AchievementId} from './AchievementDefinitions';

export interface AchievementData {
	unlocked: boolean;
	unlockedAt?: number;
	progress?: number;
}

export interface AchievementStats {
	gamesPlayed: number;
	gamesWon: number;
	totalMoves: number;
	totalUndos: number;
	totalHints: number;
	winsByDifficulty: Record<string, number>;
}

export interface AchievementSaveData {
	achievements: Record<AchievementId, AchievementData>;
	stats: AchievementStats;
}

const STORAGE_KEY = 'hexZeroAchievements';

export class AchievementStorage {
	private static defaultData: AchievementSaveData = {
		achievements: {} as Record<AchievementId, AchievementData>,
		stats: {
			gamesPlayed: 0,
			gamesWon: 0,
			totalMoves: 0,
			totalUndos: 0,
			totalHints: 0,
			winsByDifficulty: {},
		},
	};

	static load(): AchievementSaveData {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				const data = JSON.parse(stored);
				return {
					...this.defaultData,
					...data,
					stats: {
						...this.defaultData.stats,
						...data.stats,
					},
				};
			}
		} catch (e) {
			console.error('Failed to load achievements:', e);
		}
		return {...this.defaultData};
	}

	static save(data: AchievementSaveData): void {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
		} catch (e) {
			console.error('Failed to save achievements:', e);
		}
	}

	static reset(): void {
		localStorage.removeItem(STORAGE_KEY);
	}
}
