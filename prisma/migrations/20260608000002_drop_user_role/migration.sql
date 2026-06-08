-- Multi-tenant migration PR 13: drop User.role + UserRole enum.
-- Authorization lives on the Membership table now (OrganizationRole
-- per (user, org)). The legacy global-role column is no longer read
-- by any code path.

DROP INDEX IF EXISTS "User_role_idx";
ALTER TABLE "User" DROP COLUMN IF EXISTS "role";
DROP TYPE IF EXISTS "UserRole";
