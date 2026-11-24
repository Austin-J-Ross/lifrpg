import js from '@eslint/js';
import ts from 'typescript-eslint';
import globals from 'globals';
import hooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';
export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'artifacts/**',
      'playwright-report/**',
      'test-results/**',
      'tools/**',
      'tests/**',
    ],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    files: ['**/*.{ts,tsx,js}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    plugins: { 'react-hooks': hooks },
    rules: {
      ...hooks.configs.recommended.rules,
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  prettier,
];
