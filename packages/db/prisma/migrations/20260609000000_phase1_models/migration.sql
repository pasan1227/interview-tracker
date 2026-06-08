-- Phase 1 — infrastructure tables
--
-- Adds: AuditLog, ApiToken, Attachment, BillingPlan, Subscription,
-- Entitlement, UsageRecord, BackgroundJob, WebhookEndpoint,
-- WebhookDelivery. Adds Organization.stripeCustomerId.
--
-- All new tables are tenanted from day one (organizationId NOT NULL
-- except AuditLog where platform events are allowed; AuditLog's RLS
-- policy in migration 20260609000001 forbids cross-org reads).

-- ── Enums ──────────────────────────────────────────────────────────────
CREATE TYPE "AttachmentOwnerType" AS ENUM ('CANDIDATE','APPLICATION','INTERVIEW','OFFER','ORGANIZATION');
CREATE TYPE "AttachmentStatus"    AS ENUM ('PENDING_UPLOAD','UPLOADED','SCANNING','CLEAN','INFECTED','FAILED');
CREATE TYPE "BillingPlanKey"      AS ENUM ('STARTER','GROWTH','BUSINESS','ENTERPRISE');
CREATE TYPE "SubscriptionStatus"  AS ENUM ('TRIALING','ACTIVE','PAST_DUE','CANCELED','PAUSED','INCOMPLETE');
CREATE TYPE "BillingCycle"        AS ENUM ('MONTHLY','ANNUAL');
CREATE TYPE "BackgroundJobStatus" AS ENUM ('QUEUED','RUNNING','SUCCEEDED','FAILED','DEAD');
CREATE TYPE "WebhookDeliveryStatus" AS ENUM ('PENDING','SUCCEEDED','FAILED_RETRYING','FAILED_DEAD');

-- ── Organization.stripeCustomerId ─────────────────────────────────────
ALTER TABLE "Organization"
  ADD COLUMN "stripeCustomerId" TEXT;
CREATE UNIQUE INDEX "Organization_stripeCustomerId_key"
  ON "Organization"("stripeCustomerId");
CREATE INDEX "Organization_stripeCustomerId_idx"
  ON "Organization"("stripeCustomerId");

-- ── AuditLog ──────────────────────────────────────────────────────────
CREATE TABLE "AuditLog" (
  "id"             TEXT PRIMARY KEY,
  "organizationId" TEXT,
  "actorUserId"    TEXT,
  "actorTokenId"   TEXT,
  "action"         TEXT NOT NULL,
  "targetType"     TEXT NOT NULL,
  "targetId"       TEXT NOT NULL,
  "diff"           JSONB,
  "ip"             TEXT,
  "userAgent"      TEXT,
  "occurredAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "AuditLog_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,
  CONSTRAINT "AuditLog_actorUserId_fkey"
    FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL
);
CREATE INDEX "AuditLog_org_occurredAt_idx" ON "AuditLog"("organizationId","occurredAt" DESC);
CREATE INDEX "AuditLog_org_target_idx"     ON "AuditLog"("organizationId","targetType","targetId");
CREATE INDEX "AuditLog_org_actor_idx"      ON "AuditLog"("organizationId","actorUserId");
CREATE INDEX "AuditLog_action_idx"         ON "AuditLog"("action");

-- ── ApiToken ──────────────────────────────────────────────────────────
CREATE TABLE "ApiToken" (
  "id"             TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "name"           TEXT NOT NULL,
  "prefix"         TEXT NOT NULL,
  "tokenHash"      TEXT NOT NULL UNIQUE,
  "scopes"         TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdById"    TEXT NOT NULL,
  "lastUsedAt"     TIMESTAMPTZ,
  "lastUsedIp"     TEXT,
  "expiresAt"      TIMESTAMPTZ,
  "revokedAt"      TIMESTAMPTZ,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "ApiToken_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,
  CONSTRAINT "ApiToken_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT
);
CREATE INDEX "ApiToken_org_revoked_idx" ON "ApiToken"("organizationId","revokedAt");
CREATE INDEX "ApiToken_org_creator_idx" ON "ApiToken"("organizationId","createdById");

-- Backfill AuditLog.actorTokenId FK once ApiToken exists.
ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_actorTokenId_fkey"
  FOREIGN KEY ("actorTokenId") REFERENCES "ApiToken"("id") ON DELETE SET NULL;

-- ── Attachment ────────────────────────────────────────────────────────
CREATE TABLE "Attachment" (
  "id"             TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "ownerType"      "AttachmentOwnerType" NOT NULL,
  "ownerId"        TEXT NOT NULL,
  "filename"       TEXT NOT NULL,
  "mimeType"       TEXT NOT NULL,
  "sizeBytes"      INTEGER NOT NULL,
  "storageKey"     TEXT NOT NULL UNIQUE,
  "status"         "AttachmentStatus" NOT NULL DEFAULT 'PENDING_UPLOAD',
  "scannedAt"      TIMESTAMPTZ,
  "uploadedById"   TEXT,
  "uploadedAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "Attachment_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,
  CONSTRAINT "Attachment_uploadedById_fkey"
    FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL
);
CREATE INDEX "Attachment_org_owner_idx"  ON "Attachment"("organizationId","ownerType","ownerId");
CREATE INDEX "Attachment_org_status_idx" ON "Attachment"("organizationId","status");

-- ── BillingPlan ───────────────────────────────────────────────────────
CREATE TABLE "BillingPlan" (
  "id"                 TEXT PRIMARY KEY,
  "key"                "BillingPlanKey" NOT NULL UNIQUE,
  "name"               TEXT NOT NULL,
  "stripePriceMonthly" TEXT,
  "stripePriceAnnual"  TEXT,
  "features"           JSONB NOT NULL DEFAULT '{}'::jsonb,
  "active"             BOOLEAN NOT NULL DEFAULT true
);

-- ── Subscription ──────────────────────────────────────────────────────
CREATE TABLE "Subscription" (
  "id"                   TEXT PRIMARY KEY,
  "organizationId"       TEXT NOT NULL UNIQUE,
  "planId"               TEXT NOT NULL,
  "stripeSubscriptionId" TEXT UNIQUE,
  "status"               "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
  "cycle"                "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
  "trialEndsAt"          TIMESTAMPTZ,
  "currentPeriodStart"   TIMESTAMPTZ NOT NULL,
  "currentPeriodEnd"     TIMESTAMPTZ NOT NULL,
  "cancelAtPeriodEnd"    BOOLEAN NOT NULL DEFAULT false,
  "seatCount"            INTEGER NOT NULL DEFAULT 1,
  "createdAt"            TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "Subscription_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,
  CONSTRAINT "Subscription_planId_fkey"
    FOREIGN KEY ("planId") REFERENCES "BillingPlan"("id") ON DELETE RESTRICT
);
CREATE INDEX "Subscription_org_idx"    ON "Subscription"("organizationId");
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- ── Entitlement ───────────────────────────────────────────────────────
CREATE TABLE "Entitlement" (
  "id"              TEXT PRIMARY KEY,
  "subscriptionId"  TEXT NOT NULL,
  "key"             TEXT NOT NULL,
  "included"        INTEGER NOT NULL,
  "overageUnitCost" DECIMAL(10,4),
  "resetAt"         TIMESTAMPTZ NOT NULL,
  CONSTRAINT "Entitlement_subscriptionId_fkey"
    FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE,
  CONSTRAINT "Entitlement_subscription_key_unique"
    UNIQUE ("subscriptionId","key")
);

-- ── UsageRecord ───────────────────────────────────────────────────────
CREATE TABLE "UsageRecord" (
  "id"                 TEXT PRIMARY KEY,
  "organizationId"     TEXT NOT NULL,
  "subscriptionId"     TEXT,
  "key"                TEXT NOT NULL,
  "quantity"           DECIMAL(14,4) NOT NULL,
  "unitMeta"           JSONB,
  "occurredAt"         TIMESTAMPTZ NOT NULL DEFAULT now(),
  "reportedToStripeAt" TIMESTAMPTZ,
  "idempotencyKey"     TEXT NOT NULL UNIQUE,
  CONSTRAINT "UsageRecord_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,
  CONSTRAINT "UsageRecord_subscriptionId_fkey"
    FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL
);
CREATE INDEX "UsageRecord_org_key_occurredAt_idx" ON "UsageRecord"("organizationId","key","occurredAt");
CREATE INDEX "UsageRecord_reported_idx"           ON "UsageRecord"("reportedToStripeAt");

-- ── BackgroundJob ─────────────────────────────────────────────────────
CREATE TABLE "BackgroundJob" (
  "id"             TEXT PRIMARY KEY,
  "organizationId" TEXT,
  "queue"          TEXT NOT NULL,
  "name"           TEXT NOT NULL,
  "externalId"     TEXT,
  "payload"        JSONB NOT NULL,
  "attempts"       INTEGER NOT NULL DEFAULT 0,
  "status"         "BackgroundJobStatus" NOT NULL DEFAULT 'QUEUED',
  "scheduledFor"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "startedAt"      TIMESTAMPTZ,
  "finishedAt"     TIMESTAMPTZ,
  "error"          TEXT,
  CONSTRAINT "BackgroundJob_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX "BackgroundJob_org_queue_status_idx" ON "BackgroundJob"("organizationId","queue","status");
CREATE INDEX "BackgroundJob_status_scheduled_idx" ON "BackgroundJob"("status","scheduledFor");

-- ── Webhook endpoint + delivery ───────────────────────────────────────
CREATE TABLE "WebhookEndpoint" (
  "id"             TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "url"            TEXT NOT NULL,
  "secret"         TEXT NOT NULL,
  "events"         TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "active"         BOOLEAN NOT NULL DEFAULT true,
  "failureCount"   INTEGER NOT NULL DEFAULT 0,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "WebhookEndpoint_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
CREATE INDEX "WebhookEndpoint_org_active_idx" ON "WebhookEndpoint"("organizationId","active");

CREATE TABLE "WebhookDelivery" (
  "id"               TEXT PRIMARY KEY,
  "organizationId"   TEXT NOT NULL,
  "endpointId"       TEXT NOT NULL,
  "event"            TEXT NOT NULL,
  "payload"          JSONB NOT NULL,
  "attempts"         INTEGER NOT NULL DEFAULT 0,
  "status"           "WebhookDeliveryStatus" NOT NULL DEFAULT 'PENDING',
  "nextAttemptAt"    TIMESTAMPTZ,
  "lastResponseCode" INTEGER,
  "lastResponseBody" TEXT,
  "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "WebhookDelivery_endpointId_fkey"
    FOREIGN KEY ("endpointId") REFERENCES "WebhookEndpoint"("id") ON DELETE CASCADE
);
CREATE INDEX "WebhookDelivery_org_endpoint_status_idx"
  ON "WebhookDelivery"("organizationId","endpointId","status");
CREATE INDEX "WebhookDelivery_status_next_idx"
  ON "WebhookDelivery"("status","nextAttemptAt");
