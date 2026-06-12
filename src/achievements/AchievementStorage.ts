import type {AchievementId} from './AchievementDefinitions';

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

export type AchievementMap = Partial<Record<AchievementId, AchievementData>>;

export interface AchievementSaveData {
	achievements: AchievementMap;
	stats: AchievementStats;
}

const STORAGE_KEY = 'hexZeroAchievements';

function createDefaultData(): AchievementSaveData {
	return {
		achievements: {},
		stats: {
			gamesPlayed: 0,
			gamesWon: 0,
			totalMoves: 0,
			totalUndos: 0,
			totalHints: 0,
			winsByDifficulty: {},
		},
	};
}

interface StoredSaveData {
	achievements?: AchievementMap;
	stats?: Partial<AchievementStats>;
}

function isStoredSaveData(value: unknown): value is StoredSaveData {
	return typeof value === 'object' && value !== null;
}

export function loadAchievements(): AchievementSaveData {
	const defaultData = createDefaultData();
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored !== null && stored !== '') {
			const parsed: unknown = JSON.parse(stored);
			if (isStoredSaveData(parsed)) {
				return {
					...defaultData,
					...parsed,
					stats: {
						...defaultData.stats,
						...parsed.stats,
					},
				};
			}
		}
	} catch (e) {
		console.error('Failed to load achievements:', e);
	}
	return defaultData;
}

export function saveAchievements(data: AchievementSaveData): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
	} catch (e) {
		console.error('Failed to save achievements:', e);
	}
}
