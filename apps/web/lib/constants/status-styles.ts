import type { CSSProperties } from 'react';
import {
  CandidateStatus,
  InterviewStatus,
  OrganizationRole,
  Recommendation,
} from '@/lib/generated/prisma/browser';

// One source of truth for dashboard status pills. Each *_BADGE map
// returns a CSSProperties pair (`backgroundColor` + `color`) backed by
// the `--badge-*-bg` / `--badge-*-fg` tokens defined in app/globals.css.
// The tokens flip in dark mode automatically — editing hues = editing
// globals.css, not this file.
//
// Usage:
//   <Badge variant='outline' className='border-0'
//          style={CANDIDATE_STATUS_BADGE[candidate.status]}>
//     {candidate.status.replace(/_/g, ' ')}
//   </Badge>

type BadgeStyle = CSSProperties;

const badge = (
  variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'accent'
): BadgeStyle => ({
  backgroundColor: `var(--badge-${variant}-bg)`,
  color: `var(--badge-${variant}-fg)`,
});

const SUCCESS = badge('success');
const WARNING = badge('warning');
const DANGER = badge('danger');
const INFO = badge('info');
const NEUTRAL = badge('neutral');
const ACCENT = badge('accent');

export const CANDIDATE_STATUS_BADGE: Record<CandidateStatus, BadgeStyle> = {
  NEW: INFO,
  IN_PROCESS: WARNING,
  OFFERED: ACCENT,
  HIRED: SUCCESS,
  REJECTED: DANGER,
  WITHDRAWN: NEUTRAL,
};

export const INTERVIEW_STATUS_BADGE: Record<InterviewStatus, BadgeStyle> = {
  SCHEDULED: INFO,
  COMPLETED: SUCCESS,
  CANCELED: DANGER,
  NO_SHOW: WARNING,
};

export const RECOMMENDATION_BADGE: Record<Recommendation, BadgeStyle> = {
  STRONG_HIRE: SUCCESS,
  HIRE: SUCCESS,
  NO_DECISION: NEUTRAL,
  NO_HIRE: DANGER,
  STRONG_NO_HIRE: DANGER,
};

export const RECOMMENDATION_TEXT: Record<Recommendation, BadgeStyle> = {
  STRONG_HIRE: { color: 'var(--badge-success-fg)' },
  HIRE: { color: 'var(--badge-success-fg)' },
  NO_DECISION: { color: 'var(--badge-neutral-fg)' },
  NO_HIRE: { color: 'var(--badge-danger-fg)' },
  STRONG_NO_HIRE: { color: 'var(--badge-danger-fg)' },
};

export const RECOMMENDATION_LABEL: Record<Recommendation, string> = {
  STRONG_HIRE: 'Strong hire',
  HIRE: 'Hire',
  NO_DECISION: 'No decision',
  NO_HIRE: 'No hire',
  STRONG_NO_HIRE: 'Strong no hire',
};

// PR 13: User.role is gone; authorization lives on Membership now.
// USER_ROLE_BADGE is replaced by ORG_ROLE_BADGE for the members page.
export const ORG_ROLE_BADGE: Record<OrganizationRole, BadgeStyle> = {
  OWNER: ACCENT,
  ADMIN: DANGER,
  MANAGER: WARNING,
  INTERVIEWER: INFO,
  MEMBER: NEUTRAL,
};

// Workflow + position state — newly added (audit T2 surfaced inline
// bg-green-50 / bg-red-50 pills across these list views).
export const WORKFLOW_DEFAULT_BADGE: BadgeStyle = SUCCESS;
export const WORKFLOW_INACTIVE_BADGE: BadgeStyle = NEUTRAL;
export const POSITION_ACTIVE_BADGE: BadgeStyle = SUCCESS;
export const POSITION_INACTIVE_BADGE: BadgeStyle = DANGER;
export const FEEDBACK_SUBMITTED_BADGE: BadgeStyle = SUCCESS;
export const FEEDBACK_PENDING_BADGE: BadgeStyle = WARNING;
