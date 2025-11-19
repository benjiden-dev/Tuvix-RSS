import eslintPluginDrizzle from 'eslint-plugin-drizzle';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
      drizzle: eslintPluginDrizzle,
    },
    rules: {
      ...eslintPluginDrizzle.configs.recommended.rules,
      // Disable overly aggressive rule that flags non-Drizzle .delete() methods
      // (e.g., Map.delete(), R2Bucket.delete(), etc.)
      'drizzle/enforce-delete-with-where': 'off',
      // Detect explicit any types
      '@typescript-eslint/no-explicit-any': 'error',
      // Detect unsafe any usage
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
    },
  },
  {
    ignores: [
      'dist/',
      'node_modules/',
      '*.js',
      '!eslint.config.js',
      '**/*.gen.*',
      '**/__tests__/**',
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/test/**',
    ],
  },
];

