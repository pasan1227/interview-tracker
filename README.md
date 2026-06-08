# Hiring OS

Multi-tenant AI-powered recruiting SaaS — a Turborepo monorepo.

## Layout

```
apps/
├── marketing/   Next.js landing site — port 3001 in dev, apex domain in prod
├── web/         Next.js dashboard + candidate portal — port 3000 in dev, app.* in prod
├── workers/     BullMQ worker process (Node)
└── api/         Hono public API
packages/
├── db/          Prisma + tenantDb extension + tenant routing
├── audit/       Append-only audit log
├── queue/       BullMQ + Redis
├── storage/     S3/R2 + presigned uploads
├── observability/  Sentry + pino + OTel
├── billing/     Stripe customers, webhooks, entitlements
├── auth/        Permission matrix (Phase 2)
├── api-auth/    PAT issuance + verification
├── email/       Resend transport
└── core/        Shared business logic (Phase 2)
```

## Quickstart

```bash
corepack enable
yarn install

# fill in .env at the repo root — see .env.example
cp .env.example .env

# Next.js auto-discovers .env in its own directory; the workers + api
# pass --env-file=../../.env explicitly. Symlink once for each Next app
# so they share the root file (see "Environment files" below for the why).
ln -sf ../../.env apps/web/.env
ln -sf ../../.env apps/marketing/.env

# verify your .env is wired up (live-pings DB, Redis, R2, Stripe, Resend)
yarn check:env

yarn db:generate
yarn db:deploy     # includes Phase 1 RLS (use `db:deploy` for an existing DB; `db:migrate` for first-time dev)
yarn db:seed

# run everything
yarn dev

# or just one app
yarn dev:web        # dashboard, port 3000
yarn dev:marketing  # landing site, port 3001
yarn dev:workers
yarn dev:api
```

### Split: marketing vs dashboard

The site is two Next.js apps with different lifecycles:

| App              | URL (dev)               | URL (prod, suggested)       | Auth?             |
| ---------------- | ----------------------- | --------------------------- | ----------------- |
| `apps/marketing` | http://localhost:3001   | https://example.com (apex)  | Public, no auth   |
| `apps/web`       | http://localhost:3000   | https://app.example.com     | Session-protected |

Marketing is mostly static — features, pricing, customer stories, CTA. It links to the dashboard for `Sign in` and `Start free trial`, resolved at build time from `NEXT_PUBLIC_APP_URL` (which is the dashboard's public base). Dashboard's `/` redirects to `/dashboard`; the auth middleware bounces unauthenticated users to `/login`.

The two apps deploy independently — a marketing copy change doesn't require a dashboard redeploy or vice versa.

### Environment files

There is **one** `.env` for the whole monorepo, at the repo root. Each app reads it differently:

| App                   | How it loads `.env`                                                                                |
| --------------------- | -------------------------------------------------------------------------------------------------- |
| `apps/web` (Next.js)  | Next auto-discovers `.env` in the app's own directory — requires the `apps/web/.env` **symlink**.  |
| `apps/marketing`      | Same Next auto-discovery — requires the `apps/marketing/.env` **symlink**.                         |
| `apps/workers`        | Passes `--env-file=../../.env` in its `dev` / `start` scripts.                                     |
| `apps/api`            | Same — `--env-file=../../.env`.                                                                    |
| `yarn db:*`           | Passes `--env-file=../../.env` from `packages/db`.                                                 |
| `yarn check:env`      | Passes `--env-file=.env` from the root.                                                            |

Both symlinks are gitignored alongside the file itself. If either ever goes missing (manual delete, `git clean -fdx`, etc.):

```bash
ln -sf ../../.env apps/web/.env
ln -sf ../../.env apps/marketing/.env
```

Re-running the links is idempotent — `-sf` overwrites any existing file or stale link.

## Architecture

See [docs/architecture/phase-1.md](docs/architecture/phase-1.md) for the Phase 1 implementation notes (what landed, RLS, workers, public API, storage, billing, observability).

## Conventions

* Always import the Prisma client via `@hiring-os/db` (or, in `apps/web`, the `@/lib/db` re-export). Never reach into `packages/db/src/generated`.
* Use `tenantDb(ctx)` for every read/write of a tenanted model. The extension auto-injects `organizationId` and sets the Postgres RLS GUC; bypassing it requires an explicit reason.
* Audit every mutation via `withAudit(ctx, {...}, fn)` — the audit row commits atomically with the mutation.
* Never log raw tokens / passwords / PII — `packages/observability` redacts known fields, but new sensitive fields need to be added to the allow-list.
