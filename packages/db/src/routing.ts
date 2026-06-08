// packages/db/src/routing.ts
//
// Tenant routing layer. Phase 1 ships pooled-only — every tenant lives
// in the shared DB and `tenantDb()` injects organizationId. The
// abstraction is plumbed in so adding Bridge (dedicated schema) and
// Silo (dedicated DB) later requires no business-logic changes.
//
//   const routing = await resolveTenant(orgId)
//   switch (routing.mode) {
//     case 'pooled': /* default — already the only branch today */
//     case 'bridge': /* set search_path = $schema */
//     case 'silo':   /* swap in a Prisma client bound to routing.dbUrl */
//   }
//
// The lookup is intentionally cheap (a single id->row read) and is
// expected to be cached by the caller's request context.

import { db } from './client';

export type TenantRouting =
  | { mode: 'pooled'; orgId: string }
  | { mode: 'bridge'; orgId: string; schema: string }
  | { mode: 'silo'; orgId: string; dbUrl: string };

export async function resolveTenant(orgId: string): Promise<TenantRouting> {
  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: { id: true, plan: true },
  });
  if (!org) {
    throw new Error(`resolveTenant: unknown organization ${orgId}`);
  }
  // Phase 1: everyone is pooled. ENTERPRISE will route to silo in
  // Phase 8 when we add per-tenant DB provisioning.
  return { mode: 'pooled', orgId };
}
