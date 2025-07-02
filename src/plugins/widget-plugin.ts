import {registerPlugin} from '@capacitor/core';

export interface WidgetData {
	gamesPlayed: number;
	gamesWon: number;
	currentStreak: number;
	lastPlayed?: number;
}

export interface WidgetPlugin {
	updateWidgetData(data: WidgetData): Promise<void>;
}

const Widget = registerPlugin<WidgetPlugin>('Widget', {
	web: async () => {
		return {
			updateWidgetData: async () => {},
		};
	},
});

export {Widget};
