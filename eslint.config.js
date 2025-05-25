import js from '@eslint/js';
import typescript from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
    { ignores: ['dist/', 'node_modules/', '.llm/'] },

    js.configs.recommended,
    ...typescript.configs.recommended,
    eslintConfigPrettier,

    {
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                window: 'readonly',
                document: 'readonly',
                console: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                requestAnimationFrame: 'readonly',
            },
        },
        rules: {
            '@typescript-eslint/no-unused-vars': ['error', {
                argsIgnorePattern: '^_',
                caughtErrorsIgnorePattern: '^_',
                destructuredArrayIgnorePattern: '^_',
                varsIgnorePattern: '^_',
            }],
            '@typescript-eslint/no-explicit-any': 'warn',
            'no-console': ['warn', { allow: ['warn', 'error'] }],
            'semi': ['error', 'always'],
            'quotes': ['error', 'single', { 'avoidEscape': true }],
            'no-multiple-empty-lines': ['error', { 'max': 1, 'maxEOF': 0 }],
            'eol-last': ['error', 'always'],
            'no-trailing-spaces': 'error',
            'comma-dangle': ['error', 'always-multiline'],
            'line-comment-position': ['error', { 'position': 'above' }],
        },
    },
];
