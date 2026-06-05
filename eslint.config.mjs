import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypeScript from 'eslint-config-next/typescript';

const eslintConfig = [
  {
    ignores: [
      '**/generated/**',
      '**/lib/generated/**',
      '**/prisma/**',
      '**/.next/**',
      '**/dist/**',
      '**/node_modules/**',
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    rules: {
      // PR #9 cleared every `any` from the user-facing forms. Flip the
      // rule back on as a warning so a regression is visible in code
      // review without breaking CI on the ~30 remaining cases in
      // actions/* and data/* (mostly Prisma `where: any` builders and
      // a few action wrappers that will be typed alongside the workflow
      // / position Zod work in subsequent PRs).
      '@typescript-eslint/no-explicit-any': 'warn',
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
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/incompatible-library': 'warn',
    },
  },
];

export default eslintConfig;
