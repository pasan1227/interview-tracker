# Phase 1 — Infrastructure foundation

This is the implementation notes for Phase 1. For the strategic rationale, see the architecture plan (top-level `design.md` in `apps/web/` carries the older single-tenant notes; the master plan lives in chat history and the project tracker).

## What landed

```
hiring-os/
├── apps/
│   ├── web/         Next.js dashboard (existing app, moved unchanged)
│   ├── workers/     BullMQ worker process — Node + Sentry + pino + OTel
│   └── api/         Hono public API — PAT auth, per-tenant rate limit
├── packages/
│   ├── db/          Prisma + tenantDb extension + RLS-aware client + tenant routing layer
│   ├── audit/       Append-only AuditLog writer + withAudit() transactional wrapper
│   ├── queue/       BullMQ + Upstash Redis, per-tenant fairness groups, BackgroundJob audit
│   ├── storage/     S3/R2 client, presigned PUT/GET, Attachment row management
│   ├── observability/  Sentry, pino, OTel — both Node and Next.js
│   ├── billing/     Stripe client, ensureCustomer(), webhook verification
│   ├── auth/        (placeholder — Phase 2 lands permission matrix)
│   ├── api-auth/    PAT issuance + verification + scopes
│   ├── email/       Resend transport
│   └── core/        (placeholder — Phase 2 lifts shared business logic out of apps/web)
├── turbo.json       Pipeline: dev, build, test, lint, type-check, prisma:generate
└── tsconfig.base.json
```

## Database

New tables (full schema in `packages/db/prisma/schema.prisma`):

* **AuditLog** — append-only via Postgres trigger.
* **ApiToken** — SHA-256 hashed; raw value never persisted.
* **Attachment** — S3 metadata; status lifecycle `PENDING_UPLOAD → UPLOADED → SCANNING → CLEAN`.
* **BillingPlan, Subscription, Entitlement, UsageRecord** — Stripe-shaped billing primitives. Plans + entitlement enforcement land in Phase 5; the schema is here so we don't need a migration then.
* **BackgroundJob** — audit row for every BullMQ job. Lets us answer "what queues are backlogged for tenant X" without scraping Redis.
* **WebhookEndpoint, WebhookDelivery** — outbound webhook plumbing (delivery worker lands in Phase 6).

### Row-Level Security

The `20260609000001_phase1_rls` migration:

1. Enables RLS on every tenanted table (including the new Phase 1 tables).
2. Installs one policy per table: visible rows must match `app.current_org_id` (a Postgres GUC).
3. Installs a trigger on `AuditLog` blocking UPDATE/DELETE (with an `app.bypass_audit_immutability` escape hatch for legitimate GDPR erasure jobs).

The `tenantDb()` Prisma extension sets the GUC at the start of every query via `set_config('app.current_org_id', $1, true)`. The `true` makes the setting transaction-local — a leaked connection cannot carry the GUC into another tenant.

**Operational requirement:** the application connection must NOT be the database owner. Owner roles bypass RLS by default. See the migration file for the one-time `CREATE ROLE app_role` setup.

## Workers

`apps/workers` boots one Node process that registers all BullMQ workers. Phase 1 ships a single worker (`email-out`) end-to-end; Phase 3+ adds:

```ts
// apps/workers/src/index.ts
const workers = [
  startEmailOutWorker(),
  // startResumeParseWorker(),   // Phase 3
  // startEmbeddingsWorker(),    // Phase 3
  // startMatchScoreWorker(),    // Phase 3
  // startAssessmentGradeWorker(),  // Phase 4
  // startAiInterviewWorker(),   // Phase 4
  // startWebhookDeliveryWorker(),  // Phase 6
];
```

Each worker:

* Uses per-tenant **fairness groups** (`groupConcurrency` cap) so one tenant can't starve others.
* Auto-updates the `BackgroundJob` audit row through the queue/worker lifecycle.
* Inherits Sentry + pino + OTel from `@hiring-os/observability`.
* Listens on `/health` (default port 4002) for k8s readiness.

## Public API

`apps/api` runs on Hono. Phase 1 surface:

| Method | Path                  | Scope                        |
| ------ | --------------------- | ---------------------------- |
| GET    | `/health`             | none                         |
| GET    | `/openapi.json`       | none                         |
| GET    | `/v1`                 | `jobs:read` (via discovery)  |
| GET    | `/v1/jobs`            | `jobs:read`                  |
| GET    | `/v1/candidates`      | `candidates:read`            |
| GET    | `/v1/candidates/{id}` | `candidates:read`            |
| GET    | `/v1/applications`    | `applications:read`          |
| GET    | `/v1/interviews`      | `interviews:read`            |
| GET    | `/v1/feedbacks`       | `feedbacks:read`             |

Auth: `Authorization: Bearer htop_<24-char-base32>`. Tokens are issued via the dashboard (Phase 1 ships the issuance helper; the UI lands in Phase 1.5 — see `packages/api-auth/src/tokens.ts`).

Per-tenant rate limit: 600 req/min, configurable via `API_RATE_LIMIT_PER_MIN`. Implemented via Redis INCR + EXPIRE.

## Storage

Direct browser → S3 upload via presigned PUT. The flow:

```
1. UI POSTs /api/uploads/presign with {owner, filename, mimeType, sizeBytes}
2. Web creates the Attachment row (status PENDING_UPLOAD), returns presigned PUT URL
3. Browser PUTs file directly to S3/R2
4. UI POSTs /api/uploads/confirm with attachmentId
5. Web flips Attachment.status to UPLOADED
   (Phase 8 will enqueue a virus scan here)
```

All keys are prefixed `org/{organizationId}/…` and validated on confirm. A signed URL leaked from one tenant cannot be replayed against another.

## Billing

`packages/billing` ships:

* `ensureCustomer(org)` — idempotent Stripe customer creation, persists `Organization.stripeCustomerId`.
* `verifyWebhook()` + `handleWebhookEvent()` — signature verification + stubbed event router. Phase 5 implements the subscription syncing logic.

Stripe customer creation should be wired into the `actions/org/create-organization.ts` flow as a follow-up (a one-line `await ensureCustomer(org)` after the Organization is created).

## Observability

* **Sentry** — both Node (workers, api) and Next (web) initialised via `@hiring-os/observability`.
* **pino** — structured JSON in prod, pretty in dev. PII redaction baked in.
* **OTel** — `NodeSDK` with HTTP and pino instrumentations. Honeycomb / Datadog / Tempo all consume the same OTLP endpoint via `OTEL_EXPORTER_OTLP_ENDPOINT`.

## Tenant routing

`packages/db/src/routing.ts:resolveTenant(orgId)` returns:

```ts
| { mode: 'pooled', orgId }
| { mode: 'bridge', orgId, schema }
| { mode: 'silo',   orgId, dbUrl }
```

Phase 1 ships pooled-only. The abstraction is plumbed so adding Bridge (dedicated schema) or Silo (dedicated DB) later requires no business-logic changes.

## Dev workflow

```bash
# install
corepack enable && yarn install

# generate Prisma client (also runs on postinstall)
yarn db:generate

# apply migrations (including Phase 1 RLS)
yarn db:migrate

# seed
yarn db:seed

# run everything in parallel
yarn dev

# or individual apps
yarn dev:web
yarn dev:workers
yarn dev:api
```

## Open follow-ups

These are intentional Phase 1.5 / Phase 2 carry-overs, not gaps:

* Permission matrix (Role + permissions[]) — stub in `packages/auth`, lands Phase 2.
* `apps/web` action callers still import `@/lib/db` and `@/lib/tenant-db`; they resolve to `@hiring-os/db` re-exports. A find-and-replace to direct imports can happen any time, no rush.
* Stripe customer auto-creation in `actions/org/create-organization.ts` — one-line addition.
* Bull Board dashboard for queue introspection in dev.
* Token-issuance UI in `apps/web/app/(dashboard)/dashboard/settings/api-tokens`.
* PAT route in `apps/api` for token CRUD via Bearer (currently issuance is via the web app only).
