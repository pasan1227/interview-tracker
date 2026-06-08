// Tenant-scoped Prisma client.
//
// Returns a Prisma client extension that injects organizationId into
// every read/write against tenanted models. The goal is to make the
// common case ("select all candidates") safe by construction: a missed
// `where: { organizationId }` clause is impossible because the
// extension adds it transparently.
//
// Usage:
//   const ctx = toOrgContext(await requireOrgSession());
//   const db = tenantDb(ctx);
//   const candidates = await db.candidate.findMany();           // org-scoped
//   await db.candidate.create({ data: { name, email, ... } });  // org injected
//
// Boundaries (NOT enforced by this extension; enforce upstream):
// 1. Nested writes that connect/disconnect rows from other models
//    (Interview.create with `interviewers: { connect: [...] }`) cannot
//    be validated here — the extension can't tell whether the connected
//    IDs belong to the same org. Validate in the action layer with an
//    assertInOrg(ids) helper before calling.
// 2. Raw queries ($queryRaw / $executeRaw) bypass this layer entirely.
//    Put every raw query through lib/raw-queries/* and lint outside
//    callers.

import { db as baseDb } from '@/lib/db';
import {
  CREATE_OPERATIONS,
  READ_OPERATIONS,
  TENANTED_MODELS,
  WHERE_OPERATIONS,
  injectOrgIntoCreateData,
  mergeOrgFilter,
  type OrgContext,
} from '@/lib/tenant-db-helpers';

export type { OrgContext };

export function tenantDb(ctx: OrgContext) {
  if (!ctx?.organizationId) {
    throw new Error('tenantDb: missing OrgContext.organizationId');
  }
  const { organizationId } = ctx;

  return baseDb.$extends({
    name: 'tenant-scope',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!model || !TENANTED_MODELS.has(model)) {
            return query(args);
          }

          const a = (args ?? {}) as Record<string, unknown>;

          if (READ_OPERATIONS.has(operation)) {
            // findUnique with a single-column unique (`{ where: { id } }`)
            // can't accept extra fields. Rewrite to findFirst so the
            // org filter merges cleanly. The id PK lookup is still
            // O(1); we just lose Prisma's "unique-1-row" hint, which
            // doesn't matter for an indexed primary key.
            if (operation === 'findUnique' || operation === 'findUniqueOrThrow') {
              const rewritten = {
                ...a,
                where: mergeOrgFilter(
                  a.where as Record<string, unknown> | undefined,
                  organizationId
                ),
              };
              const next = operation === 'findUnique' ? 'findFirst' : 'findFirstOrThrow';
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
