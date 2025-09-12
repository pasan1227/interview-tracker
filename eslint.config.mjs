import { FlatCompat } from '@eslint/eslintrc';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: ['**/generated/**', '**/lib/generated/**', '**/prisma/**', '**/.next/**', '**/dist/**', '**/node_modules/**'],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-empty-object-type': 'off',
      'react/no-unescaped-entities': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  },
];

export default eslintConfig;

// @typescript-eslint/no-unused-vars
// 14:5  Error: A `require()` style import is forbidden.  @typescript-eslint/no-require-imports
// 371:11  Error: 'target' is defined but never used.  @typescript-eslint/no-unused-vars
// 371:19  Error: 'prop' is defined but never used.  @typescript-eslint/no-unused-vars
