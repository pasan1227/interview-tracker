// packages/audit/src/actions.ts
//
// Centralised audit action keys. Every writeAudit() call must use a
// value from here. Names are dotted lowercase, present-tense verbs:
// "<resource>.<verb>" — never include the resource ID in the action.
//
// Why the constant set: it lets us grep the codebase to find every
// place a given event is emitted, and it lets us search the audit
// table with stable strings even after refactors.

export const AUDIT_ACTIONS = {
  // Org lifecycle
  ORGANIZATION_CREATED: 'organization.created',
  ORGANIZATION_UPDATED: 'organization.updated',
  ORGANIZATION_DELETED: 'organization.deleted',

  // Membership
  MEMBERSHIP_CREATED: 'membership.created',
  MEMBERSHIP_ROLE_CHANGED: 'membership.role_changed',
  MEMBERSHIP_SUSPENDED: 'membership.suspended',
  MEMBERSHIP_REACTIVATED: 'membership.reactivated',

  // Invitations
  INVITATION_SENT: 'invitation.sent',
  INVITATION_ACCEPTED: 'invitation.accepted',
  INVITATION_REVOKED: 'invitation.revoked',

  // API tokens
  APITOKEN_CREATED: 'apitoken.created',
  APITOKEN_REVOKED: 'apitoken.revoked',

  // Attachments
  ATTACHMENT_UPLOADED: 'attachment.uploaded',
  ATTACHMENT_DELETED: 'attachment.deleted',

  // Domain (placeholders for Phase 2 — already reserved so we don't
  // collide with anything later)
  CANDIDATE_CREATED: 'candidate.created',
  CANDIDATE_UPDATED: 'candidate.updated',
  APPLICATION_MOVED: 'application.moved',
  OFFER_APPROVED: 'offer.approved',

  // Billing
  SUBSCRIPTION_CREATED: 'subscription.created',
  SUBSCRIPTION_UPDATED: 'subscription.updated',

  // Webhook
  WEBHOOK_REGISTERED: 'webhook.registered',
  WEBHOOK_DELIVERED: 'webhook.delivered',
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];
