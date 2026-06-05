# Tests

Vitest unit suite, run as `yarn test` (one-shot) / `yarn test:watch` /
`yarn test:coverage`. The CI workflow runs the suite between
`type-check` and `build`.

## What lives here

Anything with well-defined inputs/outputs and no Next runtime or
Prisma dependency:

- `tests/routes.test.ts` — `safeCallbackUrl` (open-redirect guard) +
  `DASHBOARD_ROUTES` builders.
- `tests/pagination.test.ts` — `paginate` clamps + `buildPaginatedResult`
  shape.
- `tests/rate-limit.test.ts` — local-store fallback path of the rate
  limiter (Upstash REST is integration-only).
- `tests/validations.test.ts` — Zod schemas: search params, candidate
  create, status enum.

## What doesn't

- **Server actions** in `actions/*` — they wrap auth, mutations, and
  Prisma. Add when an integration harness with a test database exists.
- **Data-layer reads** in `data/*` — same reason.
- **React components** — there's no JSX test runner configured. Reach
  for Playwright (E2E) before adding RTL here.

## Adding a test

Place the file under `tests/` matching the source path
(`lib/foo/bar.ts` → `tests/foo/bar.test.ts`). Import via the `@/`
alias to stay aligned with the rest of the codebase. The runner
resolves it (see `vitest.config.ts`).
