import {defineConfig} from 'vite-plus';

export default defineConfig({
	test: {
		dir: './src',
		environment: 'jsdom',
		globals: true,
	},
});
