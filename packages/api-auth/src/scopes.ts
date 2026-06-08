// packages/api-auth/src/scopes.ts
//
// PAT scope vocabulary. Coarser than UI permissions on purpose — API
// tokens shouldn't be able to express every UI nuance, and a customer
// scripting against our API thinks in resource:action pairs.
//
// Add new scopes here; CI greps for the exported constant to detect
// drift between issuance forms and runtime checks.

export const API_SCOPES = {
  // Read
  ORGANIZATIONS_READ: 'organizations:read',
  USERS_READ: 'users:read',
  JOBS_READ: 'jobs:read',
  CANDIDATES_READ: 'candidates:read',
  APPLICATIONS_READ: 'applications:read',
  INTERVIEWS_READ: 'interviews:read',
  FEEDBACKS_READ: 'feedbacks:read',
  REPORTS_READ: 'reports:read',
  // Write (Phase 2+)
  JOBS_WRITE: 'jobs:write',
  CANDIDATES_WRITE: 'candidates:write',
  APPLICATIONS_WRITE: 'applications:write',
  INTERVIEWS_WRITE: 'interviews:write',
  WEBHOOKS_WRITE: 'webhooks:write',
} as const;

export type ApiScope = (typeof API_SCOPES)[keyof typeof API_SCOPES];

export function hasScope(granted: string[], required: ApiScope): boolean {
  return granted.includes(required) || granted.includes('*');
}

export function assertScope(granted: string[], required: ApiScope): void {
  if (!hasScope(granted, required)) {
    throw new Error(`Missing required scope: ${required}`);
  }
}
