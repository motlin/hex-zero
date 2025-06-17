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
	},
	android: {
		allowMixedContent: false,
	},
};

export default config;
