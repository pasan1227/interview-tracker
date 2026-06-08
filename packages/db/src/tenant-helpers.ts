// packages/db/src/tenant-helpers.ts
//
// Pure helpers consumed by the tenantDb extension AND by Vitest unit
// tests. No DB, no imports from client.ts — that keeps the test runner
// from needing a populated env to evaluate the extension's logic.

import { OrganizationRole } from './generated/prisma/enums';

export type OrgContext = {
  organizationId: string;
  userId: string;
  role: OrganizationRole;
};

// Models that carry organizationId — keep in sync with schema.prisma.
// The full-coverage integration test in tests/tenant-db.test.ts asserts
// every entry here is actually a tenanted model and that no tenanted
// model is missing.
//
// Phase 1 adds: AuditLog, ApiToken, Attachment, Subscription,
// Entitlement, UsageRecord, BackgroundJob, WebhookEndpoint,
// WebhookDelivery — all start tenanted from day one.
export const TENANTED_MODELS = new Set<string>([
  // existing
  'Candidate',
  'Position',
  'Interview',
  'Feedback',
  'SkillAssessment',
  'Workflow',
  'Stage',
  'Tag',
  'Note',
  'Settings',
  'Membership',
  'Invitation',
  // Phase 1
  'AuditLog',
  'ApiToken',
  'Attachment',
  'Subscription',
  'Entitlement',
  'UsageRecord',
  'BackgroundJob',
  'WebhookEndpoint',
  'WebhookDelivery',
]);

export const READ_OPERATIONS = new Set([
  'findUnique',
  'findUniqueOrThrow',
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'count',
  'aggregate',
  'groupBy',
]);

export const WHERE_OPERATIONS = new Set([
  'update',
  'updateMany',
  'upsert',
  'delete',
  'deleteMany',
]);

export const CREATE_OPERATIONS = new Set(['create', 'createMany', 'upsert']);

export function mergeOrgFilter(
  where: Record<string, unknown> | undefined,
  organizationId: string
): Record<string, unknown> {
  const incoming = where ?? {};
  if ('organizationId' in incoming) {
    // Caller supplied an organizationId. AND with ours; if they
    // mismatch, the AND collapses to a contradiction and the query
    // returns nothing (safe failure).
    return { AND: [incoming, { organizationId }] };
  }
  return { ...incoming, organizationId };
}

export function injectOrgIntoCreateData(
  data: unknown,
  organizationId: string
): unknown {
  if (data == null) return data;
  if (Array.isArray(data)) {
    return data.map((row) => injectOrgIntoCreateData(row, organizationId));
  }
  if (typeof data !== 'object') return data;
  const obj = data as Record<string, unknown>;
  // Don't clobber if the caller already supplied an org either way.
  if ('organizationId' in obj || 'organization' in obj) return obj;
  return { ...obj, organizationId };
}
