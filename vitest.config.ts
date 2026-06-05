import { defineConfig } from 'vitest/config';
import path from 'node:path';

// Vitest is wired up for the layers that have well-defined inputs and
// outputs and no Next runtime requirement: pure utilities, Zod schemas,
// the rate-limit fallback, routes helpers, etc.
//
// Server actions and data-layer queries that hit Prisma are NOT in scope
// for unit tests — they need a real (or test-container) Postgres. Those
// are integration-test territory; add when the time comes.

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
        'lib/rate-limit.ts', // upstash path is integration-only
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
