// Pure helpers extracted from lib/tenant-db.ts so tests can import
// them without dragging in lib/db.ts (which fails env validation in
// the vitest runner). No side effects, no DB.

import { OrganizationRole } from '@/lib/generated/prisma/enums';

export type OrgContext = {
  organizationId: string;
  userId: string;
  role: OrganizationRole;
};

// Models that carry organizationId — see prisma/schema.prisma. Keep
// in sync; the integration test in PR 6 enforces full coverage.
export const TENANTED_MODELS = new Set([
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
    // Caller already supplied an organizationId. Force AND with ours
    // — if they passed a different org, the AND collapses to a
    // contradiction and the query returns nothing (safe failure).
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
  // Don't clobber if the caller already supplied an org via either
  // shape (scalar id or `organization: { connect: { id } }`). The
  // extension only fills the blank.
  if ('organizationId' in obj || 'organization' in obj) return obj;
  return { ...obj, organizationId };
}
