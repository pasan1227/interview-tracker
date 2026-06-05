// Chart color palette — every report references these instead of raw
// hex literals so the recharts surface inherits the design tokens and
// flips in dark mode via app/globals.css. Strings are CSS var refs;
// recharts passes them through to SVG `fill`, which resolves them
// against the document root like any other styled attribute.

import type { CandidateStatus, Recommendation } from '@/lib/generated/prisma/browser';

export const CHART_POSITIVE = 'var(--chart-positive)';
export const CHART_POSITIVE_SOFT = 'var(--chart-positive-soft)';
export const CHART_WARNING = 'var(--chart-warning)';
export const CHART_INFO = 'var(--chart-info)';
export const CHART_VIOLET = 'var(--chart-violet)';
export const CHART_NEGATIVE = 'var(--chart-negative)';
export const CHART_NEGATIVE_SOFT = 'var(--chart-negative-soft)';
export const CHART_NEUTRAL = 'var(--chart-neutral)';

// Mirrors the CandidateStatus enum order so a pie chart that maps
// data[].status → colors[i] keeps the conventional NEW→blue / HIRED→
// green / REJECTED→red assignment after the design token migration.
export const CANDIDATE_STATUS_CHART_COLORS: Record<CandidateStatus, string> = {
  NEW: CHART_INFO,
  IN_PROCESS: CHART_WARNING,
  OFFERED: CHART_VIOLET,
  HIRED: CHART_POSITIVE,
  REJECTED: CHART_NEGATIVE,
  WITHDRAWN: CHART_NEUTRAL,
};

export const RECOMMENDATION_CHART_COLORS: Record<Recommendation, string> = {
  STRONG_HIRE: CHART_POSITIVE,
  HIRE: CHART_POSITIVE_SOFT,
  NO_DECISION: CHART_NEUTRAL,
  NO_HIRE: CHART_NEGATIVE_SOFT,
  STRONG_NO_HIRE: CHART_NEGATIVE,
};

// Source pie/bar — sources are arbitrary strings, so we cycle a stable
// palette indexed by position. Ordering put the brand forest first so
// the largest slice picks it up.
export const SOURCE_CHART_PALETTE = [
  CHART_POSITIVE,
  CHART_INFO,
  CHART_WARNING,
  CHART_VIOLET,
  CHART_NEGATIVE,
  CHART_POSITIVE_SOFT,
  CHART_NEGATIVE_SOFT,
  CHART_NEUTRAL,
];
