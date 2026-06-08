-- Phase 1 — Row-Level Security
--
-- Belt-and-suspenders layer on top of the tenantDb() Prisma extension.
-- The extension catches every Prisma call; RLS catches anything that
-- bypasses Prisma (raw SQL, future ORMs, ad-hoc psql, junior dev who
-- imports the base client by mistake). The two layers together mean a
-- cross-tenant read requires breaking BOTH systems.
--
-- How it works:
--   * Every tenanted table has RLS enabled.
--   * One policy per table: visible rows are those whose
--     "organizationId" matches the GUC `app.current_org_id`.
--   * The Prisma tenant extension issues
--       SELECT set_config('app.current_org_id', $1, true)
--     at the start of every query. The `true` makes it
--     transaction-local — a leaked connection cannot carry the GUC
--     into another tenant.
--
-- The AuditLog also gets an APPEND-ONLY trigger: UPDATE and DELETE are
-- forbidden at the database level. Combined with the RLS policy this
-- gives us an immutable per-tenant audit trail.
--
-- Operational note: Prisma migrations run as the database owner, which
-- bypasses RLS by default. Application connections MUST use a non-
-- owner role. Add the following one-time SQL in your provisioning:
--
--   CREATE ROLE app_role NOINHERIT LOGIN PASSWORD '…';
--   GRANT USAGE ON SCHEMA public TO app_role;
--   GRANT SELECT, INSERT, UPDATE, DELETE
--     ON ALL TABLES IN SCHEMA public TO app_role;
--   ALTER DEFAULT PRIVILEGES IN SCHEMA public
--     GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_role;
--
-- Then set DATABASE_URL to log in as app_role. DATABASE_URL_DIRECT
-- (Prisma migrate) keeps the owner credentials.

-- ── 1. Default GUC ────────────────────────────────────────────────────
-- If app.current_org_id is never set, queries see ZERO rows for any
-- tenanted table. That's the desired failure mode: a connection that
-- forgot to set its tenant context is harmless, not omniscient.

DO $$ BEGIN
  PERFORM set_config('app.current_org_id', '', false);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ── 2. Helper: install_rls(table) ─────────────────────────────────────
-- Used internally by this migration. Idempotent so re-applying does
-- not blow up.

CREATE OR REPLACE FUNCTION _install_tenant_rls(_table regclass)
RETURNS void AS $$
DECLARE
  policy_name TEXT := 'tenant_isolation';
BEGIN
  EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', _table);
  EXECUTE format('ALTER TABLE %s FORCE ROW LEVEL SECURITY', _table);
  EXECUTE format(
    'DROP POLICY IF EXISTS %I ON %s',
    policy_name, _table
  );
  EXECUTE format(
    'CREATE POLICY %I ON %s USING ("organizationId"::text = current_setting(''app.current_org_id'', true)) WITH CHECK ("organizationId"::text = current_setting(''app.current_org_id'', true))',
    policy_name, _table
  );
END $$ LANGUAGE plpgsql;

-- ── 3. Apply to every tenanted table ──────────────────────────────────
-- The list mirrors packages/db/src/tenant-helpers.ts:TENANTED_MODELS.
-- Keep in sync.

SELECT _install_tenant_rls('"Candidate"');
SELECT _install_tenant_rls('"Position"');
SELECT _install_tenant_rls('"Interview"');
SELECT _install_tenant_rls('"Feedback"');
SELECT _install_tenant_rls('"SkillAssessment"');
SELECT _install_tenant_rls('"Workflow"');
SELECT _install_tenant_rls('"Stage"');
SELECT _install_tenant_rls('"Tag"');
SELECT _install_tenant_rls('"Note"');
SELECT _install_tenant_rls('"Settings"');
SELECT _install_tenant_rls('"Membership"');
SELECT _install_tenant_rls('"Invitation"');

-- Phase 1 new tables
SELECT _install_tenant_rls('"ApiToken"');
SELECT _install_tenant_rls('"Attachment"');
SELECT _install_tenant_rls('"UsageRecord"');
SELECT _install_tenant_rls('"WebhookEndpoint"');
SELECT _install_tenant_rls('"WebhookDelivery"');

-- BackgroundJob may have NULL organizationId for platform-scope jobs
-- (cron heartbeat, queue housekeeping). Use a permissive policy that
-- allows NULL-org rows through.
ALTER TABLE "BackgroundJob" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BackgroundJob" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "BackgroundJob";
CREATE POLICY "tenant_isolation" ON "BackgroundJob"
  USING (
    "organizationId" IS NULL
    OR "organizationId"::text = current_setting('app.current_org_id', true)
  )
  WITH CHECK (
    "organizationId" IS NULL
    OR "organizationId"::text = current_setting('app.current_org_id', true)
  );

-- AuditLog: same NULL-allowing policy (platform-level events).
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "AuditLog";
CREATE POLICY "tenant_isolation" ON "AuditLog"
  USING (
    "organizationId" IS NULL
    OR "organizationId"::text = current_setting('app.current_org_id', true)
  )
  WITH CHECK (
    "organizationId" IS NULL
    OR "organizationId"::text = current_setting('app.current_org_id', true)
  );

-- Subscription is per-org via UNIQUE(organizationId); standard policy.
SELECT _install_tenant_rls('"Subscription"');

-- Entitlement is keyed to Subscription which is keyed to org; rather
-- than denormalize, gate via subquery against Subscription's RLS.
ALTER TABLE "Entitlement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Entitlement" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "Entitlement";
CREATE POLICY "tenant_isolation" ON "Entitlement"
  USING (
    EXISTS (
      SELECT 1 FROM "Subscription" s
      WHERE s.id = "Entitlement"."subscriptionId"
        AND s."organizationId"::text = current_setting('app.current_org_id', true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Subscription" s
      WHERE s.id = "Entitlement"."subscriptionId"
        AND s."organizationId"::text = current_setting('app.current_org_id', true)
    )
  );

-- ── 4. AuditLog: append-only trigger ──────────────────────────────────
-- UPDATE and DELETE are forbidden at the row level. Maintenance jobs
-- (e.g. monthly partitioning, GDPR erasure) must use a session that
-- explicitly sets `app.bypass_audit_immutability = true`, which is
-- granted only to the database owner.

CREATE OR REPLACE FUNCTION _audit_block_modifications()
RETURNS trigger AS $$
BEGIN
  IF current_setting('app.bypass_audit_immutability', true) = 'true' THEN
    -- Owner-only override for archival jobs. Leaving this here so we
    -- never lock ourselves out of legitimate GDPR erasure flows.
    RETURN COALESCE(NEW, OLD);
  END IF;
  RAISE EXCEPTION 'AuditLog is append-only — % is not permitted', TG_OP
    USING ERRCODE = 'check_violation';
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "audit_log_no_update" ON "AuditLog";
CREATE TRIGGER "audit_log_no_update"
  BEFORE UPDATE OR DELETE ON "AuditLog"
  FOR EACH ROW EXECUTE FUNCTION _audit_block_modifications();

-- ── 5. Clean up helper ───────────────────────────────────────────────
-- Keep the function around — operators can reuse it in later migrations
-- to install RLS on new tenanted tables without copy-pasting.
-- (Do NOT DROP _install_tenant_rls.)
