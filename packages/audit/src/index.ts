// packages/audit/src/index.ts
//
// Audit log writer + transaction wrapper.
//
// The two write helpers:
//   * writeAudit(ctx, args)        — one-shot insert outside any
//                                    explicit transaction. Use from
//                                    fire-and-forget read events
//                                    (login, page-view, etc.) where
//                                    the mutation it accompanies is
//                                    already committed.
//   * withAudit(ctx, args, fn)     — runs `fn` inside a transaction
//                                    and inserts the audit row in the
//                                    SAME tx. Use whenever the audit
//                                    row MUST not exist if the
//                                    mutation fails (and vice versa).
//
// The audit table is append-only at the database level (see the
// `phase1_rls` migration). UPDATE / DELETE fail with a CHECK
// violation. Don't try to "fix up" an entry — emit a new row that
// supersedes it, link via diff if useful.
//
// Note on tenancy:
//   * `organizationId === null` is allowed for platform-level events
//     (super-admin actions, cron heartbeats). These rows are visible
//     to every tenant connection because the RLS policy allows
//     NULL-org rows through. Customer dashboards must filter
//     `WHERE organizationId = activeOrgId` themselves.

import { db } from '@hiring-os/db';

export { AUDIT_ACTIONS } from './actions';
export type { AuditAction } from './actions';

export type AuditActor =
  | { kind: 'user'; userId: string }
  | { kind: 'apiToken'; tokenId: string }
  | { kind: 'system' };

export type AuditCtx = {
  organizationId: string | null;
  actor: AuditActor;
  ip?: string | null;
  userAgent?: string | null;
};

export type AuditWriteArgs = {
  action: string;
  targetType: string;
  targetId: string;
  // Lightweight before/after — record only the fields that matter.
  // Two rules:
  //   1. NEVER stuff raw passwords, tokens, or PII you'd refuse to
  //      surface in a customer's audit feed.
  //   2. Keep below ~4 KB or you'll inflate the table.
  diff?: Record<string, unknown> | null;
};

function actorColumns(actor: AuditActor) {
  switch (actor.kind) {
    case 'user':
      return { actorUserId: actor.userId, actorTokenId: null };
    case 'apiToken':
      return { actorUserId: null, actorTokenId: actor.tokenId };
    case 'system':
      return { actorUserId: null, actorTokenId: null };
  }
}

export async function writeAudit(
  ctx: AuditCtx,
  args: AuditWriteArgs
): Promise<void> {
  await db.auditLog.create({
    data: {
      organizationId: ctx.organizationId,
      action: args.action,
      targetType: args.targetType,
      targetId: args.targetId,
      diff: (args.diff ?? null) as never,
      ip: ctx.ip ?? null,
      userAgent: ctx.userAgent ?? null,
      ...actorColumns(ctx.actor),
    },
  });
}

// Transactional wrapper. Returns whatever `fn` returns. The audit row
// commits atomically with the mutation — both or neither.
//
// Use like:
//   const offer = await withAudit(
//     ctx,
//     { action: AUDIT_ACTIONS.OFFER_APPROVED, targetType: 'Offer', targetId: offerId, diff: { status: { from: 'EXTENDED', to: 'APPROVED' } } },
//     async (tx) => tx.offer.update({ where: { id: offerId }, data: { status: 'APPROVED' } })
//   );
export async function withAudit<T>(
  ctx: AuditCtx,
  args: AuditWriteArgs,
  fn: (tx: Parameters<Parameters<typeof db.$transaction>[0]>[0]) => Promise<T>
): Promise<T> {
  return db.$transaction(async (tx) => {
    const result = await fn(tx);
    await tx.auditLog.create({
      data: {
        organizationId: ctx.organizationId,
        action: args.action,
        targetType: args.targetType,
        targetId: args.targetId,
        diff: (args.diff ?? null) as never,
        ip: ctx.ip ?? null,
        userAgent: ctx.userAgent ?? null,
        ...actorColumns(ctx.actor),
      },
    });
    return result;
  });
}
