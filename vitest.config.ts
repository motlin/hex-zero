import path from 'path';
import {defineConfig} from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'jsdom',
		globals: true,
	},
	resolve: {
		alias: {
			'react-native': path.resolve(__dirname, '__mocks__/react-native.ts'),
			'@shopify/react-native-skia': path.resolve(__dirname, '__mocks__/react-native-skia.ts'),
			'react-native-reanimated': path.resolve(__dirname, '__mocks__/react-native-reanimated.ts'),
		},
	},
});
