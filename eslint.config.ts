import js from '@eslint/js';
import globals from 'globals';
import typescript from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import type {Linter} from 'eslint';

const config: Linter.Config[] = [
	{ignores: ['dist/', 'node_modules/', '.llm/']},

	js.configs.recommended,
	...typescript.configs.recommended,
	eslintConfigPrettier,

	{
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: {
				...globals.browser,
			},
		},
		rules: {
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_',
					destructuredArrayIgnorePattern: '^_',
					varsIgnorePattern: '^_',
				},
			],
			'@typescript-eslint/no-explicit-any': 'warn',
			'no-console': ['warn', {allow: ['warn', 'error']}],
			semi: 'off',
			quotes: 'off',
			'no-multiple-empty-lines': 'off',
			'eol-last': 'off',
			'no-trailing-spaces': 'off',
			'comma-dangle': 'off',
			'line-comment-position': ['error', {position: 'above'}],
		},
	},
];

export default config;
