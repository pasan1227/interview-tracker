import { defineConfig } from 'vitest/config';
import path from 'node:path';

// Vitest is wired up for the layers that have well-defined inputs and
// outputs and no Next runtime requirement: pure utilities, Zod schemas,
// the rate-limit fallback, routes helpers, etc.
//
// Server actions and data-layer queries that hit Prisma are NOT in scope
// for unit tests — they need a real (or test-container) Postgres. Those
// are integration-test territory; add when the time comes.
//
// After the Phase 1 monorepo migration, source aliases redirect across
// the workspace: `@hiring-os/*` resolves into ../../packages/*, and
// `@/lib/generated/prisma/*` follows the new Prisma client output.

const repoRoot = path.resolve(__dirname, '..', '..');
const pkg = (name: string) => path.resolve(repoRoot, 'packages', name, 'src');

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    globals: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['lib/**', 'routes.ts', 'hooks/use-form-action.ts'],
      exclude: [
        'lib/generated/**',
        'lib/db.ts',
        'lib/mail.ts',
        'lib/rate-limit.ts',
      ],
    },
  },
  resolve: {
    alias: [
      // Order matters — more-specific aliases first.
      {
        find: /^@\/lib\/generated\/prisma$/,
        replacement: path.resolve(pkg('db'), 'generated/prisma'),
      },
      {
        find: /^@\/lib\/generated\/prisma\/(.*)$/,
        replacement: path.resolve(pkg('db'), 'generated/prisma') + '/$1',
      },
      { find: '@hiring-os/db', replacement: pkg('db') },
      { find: '@hiring-os/audit', replacement: pkg('audit') },
      { find: '@hiring-os/queue', replacement: pkg('queue') },
      { find: '@hiring-os/storage', replacement: pkg('storage') },
      { find: '@hiring-os/observability', replacement: pkg('observability') },
      { find: '@hiring-os/billing', replacement: pkg('billing') },
      { find: '@hiring-os/auth', replacement: pkg('auth') },
      { find: '@hiring-os/api-auth', replacement: pkg('api-auth') },
      { find: '@hiring-os/email', replacement: pkg('email') },
      { find: '@hiring-os/core', replacement: pkg('core') },
      { find: '@', replacement: path.resolve(__dirname, '.') },
    ],
  },
});
