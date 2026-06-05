import {
  CandidateStatus,
  InterviewStatus,
  Recommendation,
  UserRole,
} from '@/lib/generated/prisma/client';

// One source of truth for the dashboard's color palette. Pair the BADGE
// classes with `<Badge variant='outline' className={`${BADGE[x]} border-0`}>`.
// LABEL maps render the human-readable form (e.g. "Strong Hire"). TEXT maps
// are for inline foreground use where a background pill isn't wanted.

export const CANDIDATE_STATUS_BADGE: Record<CandidateStatus, string> = {
  NEW: 'bg-blue-50 text-blue-600',
  IN_PROCESS: 'bg-yellow-50 text-yellow-600',
  OFFERED: 'bg-purple-50 text-purple-600',
  HIRED: 'bg-green-50 text-green-600',
  REJECTED: 'bg-red-50 text-red-600',
  WITHDRAWN: 'bg-gray-50 text-gray-600',
};

export const INTERVIEW_STATUS_BADGE: Record<InterviewStatus, string> = {
  SCHEDULED: 'bg-blue-50 text-blue-600',
  COMPLETED: 'bg-green-50 text-green-600',
  CANCELED: 'bg-red-50 text-red-600',
  NO_SHOW: 'bg-yellow-50 text-yellow-600',
};

export const RECOMMENDATION_BADGE: Record<Recommendation, string> = {
  STRONG_HIRE: 'bg-green-50 text-green-600',
  HIRE: 'bg-green-50 text-green-600',
  NO_DECISION: 'bg-gray-50 text-gray-600',
  NO_HIRE: 'bg-red-50 text-red-600',
  STRONG_NO_HIRE: 'bg-red-50 text-red-600',
};

export const RECOMMENDATION_TEXT: Record<Recommendation, string> = {
  STRONG_HIRE: 'text-green-600',
  HIRE: 'text-green-600',
  NO_DECISION: 'text-gray-600',
  NO_HIRE: 'text-red-600',
  STRONG_NO_HIRE: 'text-red-600',
};

export const RECOMMENDATION_LABEL: Record<Recommendation, string> = {
  STRONG_HIRE: 'Strong Hire',
  HIRE: 'Hire',
  NO_DECISION: 'No Decision',
  NO_HIRE: 'No Hire',
  STRONG_NO_HIRE: 'Strong No Hire',
};

export const USER_ROLE_BADGE: Record<UserRole, string> = {
  ADMIN: 'bg-red-50 text-red-600',
  MANAGER: 'bg-purple-50 text-purple-600',
  INTERVIEWER: 'bg-blue-50 text-blue-600',
  USER: 'bg-gray-50 text-gray-600',
};
