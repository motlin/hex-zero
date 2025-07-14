import {defineConfig} from 'vite';
import {resolve} from 'path';

export default defineConfig({
	root: '.',
	build: {
		outDir: 'dist',
		rollupOptions: {
			input: {
				main: resolve(__dirname, 'index.html'),
			},
		},
		sourcemap: true,
	},
	server: {
		port: 3000,
	},
});
