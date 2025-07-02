export type AchievementId =
	| 'beat_easy'
	| 'beat_medium'
	| 'beat_hard'
	| 'beat_extreme'
	| 'beat_impossible'
	| 'beat_easy_no_undo'
	| 'beat_medium_no_undo'
	| 'beat_hard_no_undo'
	| 'beat_extreme_no_undo'
	| 'beat_impossible_no_undo'
	| 'beat_easy_in_order'
	| 'beat_medium_in_order'
	| 'beat_hard_in_order'
	| 'beat_extreme_in_order'
	| 'beat_impossible_in_order';

export interface Achievement {
	id: AchievementId;
	name: string;
	description: string;
	icon: string;
	points: number;
	hidden?: boolean;
}

export const DIFFICULTY_LEVELS = ['Easy', 'Medium', 'Hard', 'Extreme', 'Impossible'] as const;
export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number];

export const ACHIEVEMENTS: Record<AchievementId, Achievement> = {
	beat_easy: {
		id: 'beat_easy',
		name: 'First Steps',
		description: 'Beat Easy difficulty',
		icon: '🌱',
		points: 10,
	},
	beat_medium: {
		id: 'beat_medium',
		name: 'Getting There',
		description: 'Beat Medium difficulty',
		icon: '🌿',
		points: 15,
	},
	beat_hard: {
		id: 'beat_hard',
		name: 'Challenging',
		description: 'Beat Hard difficulty',
		icon: '🌳',
		points: 20,
	},
	beat_extreme: {
		id: 'beat_extreme',
		name: 'Extreme Solver',
		description: 'Beat Extreme difficulty',
		icon: '🔥',
		points: 30,
	},
	beat_impossible: {
		id: 'beat_impossible',
		name: 'The Impossible',
		description: 'Beat Impossible difficulty',
		icon: '💎',
		points: 50,
	},
	beat_easy_no_undo: {
		id: 'beat_easy_no_undo',
		name: 'Perfect Start',
		description: 'Beat Easy difficulty without using undo',
		icon: '⭐',
		points: 15,
	},
	beat_medium_no_undo: {
		id: 'beat_medium_no_undo',
		name: 'Flawless Progress',
		description: 'Beat Medium difficulty without using undo',
		icon: '🌟',
		points: 20,
	},
	beat_hard_no_undo: {
		id: 'beat_hard_no_undo',
		name: 'Perfect Precision',
		description: 'Beat Hard difficulty without using undo',
		icon: '✨',
		points: 30,
	},
	beat_extreme_no_undo: {
		id: 'beat_extreme_no_undo',
		name: 'Extreme Perfection',
		description: 'Beat Extreme difficulty without using undo',
		icon: '🎯',
		points: 40,
	},
	beat_impossible_no_undo: {
		id: 'beat_impossible_no_undo',
		name: 'Godlike',
		description: 'Beat Impossible difficulty without using undo',
		icon: '🏆',
		points: 60,
	},
	beat_easy_in_order: {
		id: 'beat_easy_in_order',
		name: 'Orderly Beginner',
		description: 'Beat Easy difficulty placing pieces in order',
		icon: '1️⃣',
		points: 15,
	},
	beat_medium_in_order: {
		id: 'beat_medium_in_order',
		name: 'Sequential Solver',
		description: 'Beat Medium difficulty placing pieces in order',
		icon: '2️⃣',
		points: 20,
	},
	beat_hard_in_order: {
		id: 'beat_hard_in_order',
		name: 'Methodical Master',
		description: 'Beat Hard difficulty placing pieces in order',
		icon: '3️⃣',
		points: 30,
	},
	beat_extreme_in_order: {
		id: 'beat_extreme_in_order',
		name: 'Extreme Order',
		description: 'Beat Extreme difficulty placing pieces in order',
		icon: '4️⃣',
		points: 40,
	},
	beat_impossible_in_order: {
		id: 'beat_impossible_in_order',
		name: 'Perfect Sequence',
		description: 'Beat Impossible difficulty placing pieces in order',
		icon: '5️⃣',
		points: 60,
	},
};

export function getAchievementsByCategory(): {
	completion: Achievement[];
	perfection: Achievement[];
	inOrder: Achievement[];
} {
	return {
		completion: [
			ACHIEVEMENTS.beat_easy,
			ACHIEVEMENTS.beat_medium,
			ACHIEVEMENTS.beat_hard,
			ACHIEVEMENTS.beat_extreme,
			ACHIEVEMENTS.beat_impossible,
		],
		perfection: [
			ACHIEVEMENTS.beat_easy_no_undo,
			ACHIEVEMENTS.beat_medium_no_undo,
			ACHIEVEMENTS.beat_hard_no_undo,
			ACHIEVEMENTS.beat_extreme_no_undo,
			ACHIEVEMENTS.beat_impossible_no_undo,
		],
		inOrder: [
			ACHIEVEMENTS.beat_easy_in_order,
			ACHIEVEMENTS.beat_medium_in_order,
			ACHIEVEMENTS.beat_hard_in_order,
			ACHIEVEMENTS.beat_extreme_in_order,
			ACHIEVEMENTS.beat_impossible_in_order,
		],
	};
}
