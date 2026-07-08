import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
	{
		ignores: [
			'.DS_Store',
			'build/**',
			'.svelte-kit/**',
			'package/**',
			'node_modules/**',
			'package-lock.json',
			'pnpm-lock.yaml',
			'yarn.lock',
		],
	},
	js.configs.recommended,
	...tsPlugin.configs['flat/recommended'],
	...svelte.configs['flat/recommended'],
	...svelte.configs['flat/prettier'],
	prettier,
	{
		languageOptions: {
			ecmaVersion: 2020,
			sourceType: 'module',
			globals: {
				...globals.browser,
				...globals.es2017,
				...globals.node,
			},
		},
	},
	{
		files: ['**/*.ts'],
		languageOptions: {
			parser: tsParser,
		},
	},
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parserOptions: {
				parser: tsParser,
			},
		},
	},
	{
		rules: {
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/no-unused-expressions': 'warn',
			'@typescript-eslint/no-unused-vars': 'warn',
			'no-useless-escape': 'warn',
			'svelte/no-navigation-without-resolve': 'warn',
			'svelte/no-useless-children-snippet': 'warn',
			'svelte/prefer-svelte-reactivity': 'warn',
			'svelte/require-each-key': 'warn',
		},
	},
];
