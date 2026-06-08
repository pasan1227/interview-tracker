// apps/web/lib/tenant-db-helpers.ts
//
// Re-export shim. See packages/db/src/tenant-helpers.ts.

export {
  TENANTED_MODELS,
  READ_OPERATIONS,
  WHERE_OPERATIONS,
  CREATE_OPERATIONS,
  mergeOrgFilter,
  injectOrgIntoCreateData,
} from '@hiring-os/db';
export type { OrgContext } from '@hiring-os/db';
