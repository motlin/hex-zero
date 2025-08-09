import {defineConfig} from 'vite';
import {resolve} from 'path';

export default defineConfig(({mode: _mode}) => {
	const isGitHubPages = process.env['GITHUB_ACTIONS'] === 'true';
	const base = isGitHubPages ? '/hex-zero/' : '/';

	return {
		base,
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
	};
});
