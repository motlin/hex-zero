import {registerPlugin} from '@capacitor/core';

export interface VoiceAssistantPlugin {
	/**
	 * Donate a shortcut to Siri (iOS only)
	 */
	donateShortcut(options: {
		identifier: string;
		title: string;
		suggestedPhrase: string;
		difficulty: string;
	}): Promise<void>;

	/**
	 * Check if voice assistant is available
	 */
	isAvailable(): Promise<{available: boolean}>;

	/**
	 * Request Siri shortcut setup (iOS only)
	 */
	presentShortcutSetup(options: {identifier: string}): Promise<void>;
}

export const VoiceAssistant = registerPlugin<VoiceAssistantPlugin>('VoiceAssistant', {
	web: {
		async donateShortcut(_options: {
			identifier: string;
			title: string;
			suggestedPhrase: string;
			difficulty: string;
		}) {},
		async isAvailable() {
			return {available: false};
		},
		async presentShortcutSetup(_options: {identifier: string}) {},
	},
});
