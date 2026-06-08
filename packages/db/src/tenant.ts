// packages/db/src/tenant.ts
//
// Returns a tenant-scoped Prisma client. Every read/write against a
// model in TENANTED_MODELS automatically merges `organizationId` into
// the WHERE clause and into the create payload. A missed
// `where: { organizationId }` becomes physically impossible.
//
// On top of the WHERE-clause injection, this layer ALSO sets the
// Postgres GUC `app.current_org_id` for the duration of the query.
// That GUC is read by the RLS policies installed in the
// `phase1_rls` migration. Two layers of defense — the GUC catches raw
// queries and the WHERE injection catches everything else.
//
// Boundaries (NOT enforced here; enforce upstream):
// 1. Nested writes with connect/disconnect referencing IDs from other
//    models — call assertInOrg(ids) before invoking.
// 2. Raw queries — see packages/db/src/raw.ts; the GUC will block
//    cross-tenant reads but explicit assertion is still required.

import { db as baseDb } from './client';
import {
  CREATE_OPERATIONS,
  READ_OPERATIONS,
  TENANTED_MODELS,
  WHERE_OPERATIONS,
  injectOrgIntoCreateData,
  mergeOrgFilter,
  type OrgContext,
} from './tenant-helpers';
import { resolveTenant } from './routing';

export type { OrgContext };

// Cache of resolved tenant routings keyed by organizationId. Routing is
// a tiny indexed lookup that almost never changes — caching the result
// for the request avoids hitting the DB once per query.
const routingCache = new WeakMap<OrgContext, Promise<unknown>>();

export function tenantDb(ctx: OrgContext) {
  if (!ctx?.organizationId) {
    throw new Error('tenantDb: missing OrgContext.organizationId');
  }
  const { organizationId } = ctx;

  // Kick off tenant routing resolution lazily.
  if (!routingCache.has(ctx)) {
    routingCache.set(ctx, resolveTenant(organizationId).catch(() => null));
  }

  return baseDb.$extends({
    name: 'tenant-scope',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!model || !TENANTED_MODELS.has(model)) {
            return query(args);
          }

          // RLS GUC: scope every subsequent query in this connection
          // to the active org. set_config is idempotent and cheap.
          // We use a transaction-local set (third arg `true`) so a
          // leaked connection can't carry the GUC into another tenant.
          // For non-transactional queries, Prisma issues this in the
          // same connection lease — the policy still applies because
          // the SET runs before the actual query.
          await baseDb.$executeRawUnsafe(
            `SELECT set_config('app.current_org_id', $1, true)`,
            organizationId
          );

          const a = (args ?? {}) as Record<string, unknown>;

          if (READ_OPERATIONS.has(operation)) {
            if (operation === 'findUnique' || operation === 'findUniqueOrThrow') {
              const rewritten = {
                ...a,
                where: mergeOrgFilter(
                  a.where as Record<string, unknown> | undefined,
                  organizationId
                ),
              };
              const next =
                operation === 'findUnique' ? 'findFirst' : 'findFirstOrThrow';
              const modelKey = model.charAt(0).toLowerCase() + model.slice(1);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              return (baseDb as any)[modelKey][next](rewritten);
            }
            return query({
              ...a,
              where: mergeOrgFilter(
                a.where as Record<string, unknown> | undefined,
                organizationId
              ),
            });
          }

          if (CREATE_OPERATIONS.has(operation)) {
            a.data = injectOrgIntoCreateData(a.data, organizationId);
          }

          if (WHERE_OPERATIONS.has(operation) && a.where) {
            a.where = mergeOrgFilter(
              a.where as Record<string, unknown>,
              organizationId
            );
          }

          return query(a);
        },
      },
    },
  });
}

// Helper for actions that need to validate "are all these IDs in my
// org" before doing a connect/disconnect that bypasses the extension.
export async function assertInOrg<T extends string>(
  ctx: OrgContext,
  model: T,
  ids: string[]
): Promise<void> {
  if (ids.length === 0) return;
  const modelKey = model.charAt(0).toLowerCase() + model.slice(1);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const count = await (baseDb as any)[modelKey].count({
    where: { id: { in: ids }, organizationId: ctx.organizationId },
  });
  if (count !== ids.length) {
    throw new Error(
      `assertInOrg: ${ids.length - count} of ${ids.length} ${model} IDs not in org ${ctx.organizationId}`
    );
  }
}
