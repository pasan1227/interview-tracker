// apps/web/lib/tenant-db.ts
//
// Re-export shim. The implementation and contract live in
// packages/db/src/tenant.ts.

export { tenantDb, assertInOrg } from '@hiring-os/db';
export type { OrgContext } from '@hiring-os/db';
