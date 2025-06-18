import js from '@eslint/js';
import globals from 'globals';
import typescript from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import type {Linter} from 'eslint';

const config: Linter.Config[] = [
	{ignores: ['dist/', 'node_modules/', '.llm/', 'ios/', 'android/']},

	js.configs.recommended as Linter.Config,
	...(typescript.configs.recommended as Linter.Config[]),
	eslintConfigPrettier as Linter.Config,

	{
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: {
				...globals.browser,
				module: 'readonly',
				require: 'readonly',
				__dirname: 'readonly',
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
			'@typescript-eslint/no-require-imports': 'off',
		},
	},
];

export default config;
