module.exports = {
	parser: '@typescript-eslint/parser',
	extends: [
		'eslint:recommended',
		'standard',
		'prettier',
		'plugin:@typescript-eslint/recommended',
		'plugin:@typescript-eslint/eslint-recommended',
		'eslint-config-prettier',
	],
	parserOptions: {
		sourceType: 'module',
		warnOnUnsupportedTypeScriptVersion: true,
		modules: true,
		ecmaVersion: 2021,
	},
	env: {
		es6: true,
		node: true,
	},
	rules: {
		'prettier/prettier': 'error',
		'simple-import-sort/imports': 'error',
		'simple-import-sort/exports': 'error',
	},
	plugins: ['@typescript-eslint', 'prettier', 'vitest', 'promise', 'simple-import-sort'],
	ignorePatterns: ['dist', 'node_modules'],
};
