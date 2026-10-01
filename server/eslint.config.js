import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier/flat';

export default [
  { ignores: ['node_modules', 'coverage', 'src/generated'] },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.node,
      },
      sourceType: 'module',
    },
    rules: {
      // Formatting (2-space indent, single quotes, semicolons) is owned by
      // Prettier - see .prettierrc.json. eslint-config-prettier disables the
      // stylistic ESLint rules so the two tools never disagree, so they are
      // intentionally not re-enabled here.
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.vitest,
      },
    },
  },
  prettier,
];
