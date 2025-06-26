import {defineConfig} from 'vite-plus';
import {resolve} from 'node:path';

export default defineConfig({
	test: {
		environment: 'jsdom',
		globals: true,
	},
	resolve: {
		alias: {
			'react-native': resolve(__dirname, '__mocks__/react-native.ts'),
			'@shopify/react-native-skia': resolve(__dirname, '__mocks__/react-native-skia.ts'),
		},
	},
});
