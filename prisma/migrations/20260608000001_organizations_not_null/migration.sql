-- Multi-tenant migration PR 3: flip organizationId to NOT NULL on
-- every tenanted domain table; replace Tag.name global unique with
-- a per-org composite unique; add Settings @@unique([organizationId])
-- so each org has exactly one settings row.
--
-- Preconditions: PR 2 backfill has populated organizationId on every
-- existing row (sanity-checked by the backfill script before exit).
--
-- Idempotent: every step uses IF EXISTS / IF NOT EXISTS where
-- available, and SET NOT NULL is a no-op when the column is already
-- NOT NULL. Recovers cleanly from a half-applied state.

-- ── Tighten organizationId to NOT NULL ───────────────────────────
ALTER TABLE "Candidate"       ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Position"        ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Interview"       ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Feedback"        ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "SkillAssessment" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Workflow"        ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Stage"           ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Tag"             ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Note"            ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Settings"        ALTER COLUMN "organizationId" SET NOT NULL;

-- ── Tag: per-org name uniqueness ─────────────────────────────────
-- Tag_name_key is a unique index (created by Prisma's @unique on
-- `name`), not a separate named constraint. Drop the index directly.
DROP INDEX IF EXISTS "Tag_name_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Tag_organizationId_name_key"
  ON "Tag"("organizationId", "name");

-- ── Settings: one row per org ────────────────────────────────────
-- The unique index covers single-column lookups too, so the standalone
-- organizationId index is now redundant.
DROP INDEX IF EXISTS "Settings_organizationId_idx";
CREATE UNIQUE INDEX IF NOT EXISTS "Settings_organizationId_key"
  ON "Settings"("organizationId");
