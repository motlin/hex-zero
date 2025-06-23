import type {CapacitorConfig} from '@capacitor/cli';

const config: CapacitorConfig = {
	appId: 'com.hexzero.game',
	appName: 'Hex Zero',
	webDir: 'dist',
	server: {
		androidScheme: 'https',
		iosScheme: 'capacitor',
		cleartext: false,
	},
	backgroundColor: '#1a1a1a',
	ios: {
		contentInset: 'automatic',
		// Properly handle safe areas on iOS
		scrollEnabled: false,
	},
	android: {
		allowMixedContent: false,
		// Handle Android system UI
		backgroundColor: '#1a1a1a',
	},
	plugins: {
		StatusBar: {
			style: 'DARK',
			backgroundColor: '#1a1a1a',
		},
		Keyboard: {
			resize: 'none',
			resizeOnFullScreen: true,
		},
	},
};

export default config;
