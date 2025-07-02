import {App, type URLOpenListenerEvent} from '@capacitor/app';
import {Capacitor} from '@capacitor/core';
import {HapticFeedback} from '../haptic-feedback';
import {VoiceAssistant} from '../plugins/voice-assistant-plugin';

export interface VoiceCommand {
	action: 'startGame';
	difficulty?: 'easy' | 'medium' | 'hard' | 'extreme' | 'impossible';
}

function isVoiceDifficulty(value: string | null): value is NonNullable<VoiceCommand['difficulty']> {
	return value === 'easy' || value === 'medium' || value === 'hard' || value === 'extreme' || value === 'impossible';
}

export class VoiceAssistantManager {
	private static instance: VoiceAssistantManager | undefined;
	private isInitialized = false;

	private constructor() {}

	static getInstance(): VoiceAssistantManager {
		VoiceAssistantManager.instance ??= new VoiceAssistantManager();
		return VoiceAssistantManager.instance;
	}

	initialize(): void {
		if (this.isInitialized) {
			return;
		}

		this.isInitialized = true;
		this.setupDeepLinking();

		if (Capacitor.isNativePlatform()) {
			this.setupPlatformSpecificFeatures();
		}
	}

	private setupDeepLinking(): void {
		// Handle app being opened from a URL
		void App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
			this.handleDeepLink(event.url);
		});

		// Check if app was opened with a URL
		void App.getLaunchUrl().then((result) => {
			const url = result?.url;
			if (url !== undefined && url !== '') {
				this.handleDeepLink(url);
			}
		});
	}

	private handleDeepLink(url: string): void {
		try {
			const parsedUrl = new URL(url);
			const action = parsedUrl.pathname.replace(/^\//, '');
			const difficulty = parsedUrl.searchParams.get('difficulty');

			if (action === 'play' || action === 'start') {
				this.handleStartGameCommand(isVoiceDifficulty(difficulty) ? difficulty : undefined);
			}
		} catch (error) {
			console.error('Error parsing deep link:', error);
		}
	}

	private handleStartGameCommand(difficulty?: VoiceCommand['difficulty']): void {
		void HapticFeedback.lightTap();

		// Map difficulty to game parameters
		const difficultyMap = {
			easy: {radius: 3, pieces: 5},
			medium: {radius: 3, pieces: 7},
			hard: {radius: 4, pieces: 9},
			extreme: {radius: 5, pieces: 11},
			impossible: {radius: 5, pieces: 13},
		};

		const params = difficultyMap[difficulty ?? 'medium'];

		// Show game screen
		const difficultyScreen = document.getElementById('difficultyScreen');
		const gameScreen = document.getElementById('gameScreen');

		if (difficultyScreen && gameScreen) {
			difficultyScreen.classList.add('hidden');
			gameScreen.classList.remove('hidden');
		}

		// Start the game
		window.startGame(params.radius, params.pieces);
	}

	private setupPlatformSpecificFeatures(): void {
		const platform = Capacitor.getPlatform();

		if (platform === 'ios') {
			void this.setupSiriShortcuts();
		} else if (platform === 'android') {
			this.setupAndroidAppActions();
		}
	}

	private async setupSiriShortcuts(): Promise<void> {
		try {
			const {available} = await VoiceAssistant.isAvailable();

			if (!available) {
				return;
			}

			// Donate shortcuts for each difficulty
			const difficulties = [
				{id: 'easy', title: 'Start Easy Hex Zero Game', phrase: 'Play easy Hex Zero'},
				{id: 'medium', title: 'Start Medium Hex Zero Game', phrase: 'Play medium Hex Zero'},
				{id: 'hard', title: 'Start Hard Hex Zero Game', phrase: 'Play hard Hex Zero'},
				{id: 'extreme', title: 'Start Extreme Hex Zero Game', phrase: 'Play extreme Hex Zero'},
				{id: 'impossible', title: 'Start Impossible Hex Zero Game', phrase: 'Play impossible Hex Zero'},
			];

			for (const diff of difficulties) {
				await VoiceAssistant.donateShortcut({
					identifier: `com.hexzero.game.start${diff.id.charAt(0).toUpperCase() + diff.id.slice(1)}Game`,
					title: diff.title,
					suggestedPhrase: diff.phrase,
					difficulty: diff.id,
				});
			}
		} catch (error) {
			console.error('Error setting up Siri shortcuts:', error);
		}
	}

	private setupAndroidAppActions(): void {}

	// Method to programmatically donate a shortcut (iOS)
	async donateShortcut(difficulty: string): Promise<void> {
		if (Capacitor.getPlatform() === 'ios') {
			try {
				const titles: Record<string, string> = {
					easy: 'Start Easy Hex Zero Game',
					medium: 'Start Medium Hex Zero Game',
					hard: 'Start Hard Hex Zero Game',
					extreme: 'Start Extreme Hex Zero Game',
					impossible: 'Start Impossible Hex Zero Game',
				};

				const phrases: Record<string, string> = {
					easy: 'Play easy Hex Zero',
					medium: 'Play medium Hex Zero',
					hard: 'Play hard Hex Zero',
					extreme: 'Play extreme Hex Zero',
					impossible: 'Play impossible Hex Zero',
				};

				const title = titles[difficulty] ?? titles['medium'];
				const suggestedPhrase = phrases[difficulty] ?? phrases['medium'];

				if (title !== undefined && suggestedPhrase !== undefined) {
					await VoiceAssistant.donateShortcut({
						identifier: `com.hexzero.game.start${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}Game`,
						title,
						suggestedPhrase,
						difficulty,
					});
				}
			} catch (error) {
				console.error(`Error donating shortcut for ${difficulty}:`, error);
			}
		}
	}
}
