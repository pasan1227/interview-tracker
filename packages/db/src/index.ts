// packages/db/src/index.ts
//
// Public entrypoint. Import from `@hiring-os/db` everywhere except in
// migrations / scripts that need the raw client.

export { db } from './client';
export type { Db } from './client';
export { tenantDb, assertInOrg } from './tenant';
export type { OrgContext } from './tenant';
export {
  TENANTED_MODELS,
  READ_OPERATIONS,
  WHERE_OPERATIONS,
  CREATE_OPERATIONS,
  mergeOrgFilter,
  injectOrgIntoCreateData,
} from './tenant-helpers';
export { resolveTenant } from './routing';
export type { TenantRouting } from './routing';
export * as Enums from './generated/prisma/enums';
