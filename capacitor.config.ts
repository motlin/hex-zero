import type {CapacitorConfig} from '@capacitor/cli';

const config: CapacitorConfig = {
	appId: 'com.hexzero.game',
	appName: 'Hex Zero',
	webDir: 'dist',
	bundledWebRuntime: false,
	server: {
		androidScheme: 'https',
		iosScheme: 'capacitor',
		cleartext: false,
	},
	backgroundColor: '#1a1a1a',
	ios: {
		contentInset: 'automatic',
		scrollEnabled: false,
		scheme: 'App',
	},
	android: {
		allowMixedContent: false,
		backgroundColor: '#1a1a1a',
		webContentsDebuggingEnabled: false,
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
