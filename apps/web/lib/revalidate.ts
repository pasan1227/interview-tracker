// Per-resource revalidation helpers. Every mutation action used to
// hand-roll the same 3-4 revalidatePath calls; missing one left stale
// UI. Each helper here owns the canonical set for one resource and
// always re-validates the dashboard root (which renders the recent-
// activity lists). Adding a new dashboard widget that consumes one of
// these resources means editing one helper, not every action.

import { revalidatePath } from 'next/cache';
import { DASHBOARD_ROUTES } from '@/routes';

const ROOT = DASHBOARD_ROUTES.root;

export function revalidateCandidate(id?: string) {
  if (id) revalidatePath(DASHBOARD_ROUTES.candidates.detail(id));
  revalidatePath(DASHBOARD_ROUTES.candidates.list);
  revalidatePath(ROOT);
}

export function revalidateInterview(opts: {
  id?: string;
  candidateId?: string;
}) {
  if (opts.id) revalidatePath(DASHBOARD_ROUTES.interviews.detail(opts.id));
  revalidatePath(DASHBOARD_ROUTES.interviews.list);
  if (opts.candidateId) {
    revalidatePath(DASHBOARD_ROUTES.candidates.detail(opts.candidateId));
  }
  revalidatePath(ROOT);
}

export function revalidateFeedback(opts: {
  feedbackId?: string;
  interviewId?: string;
  candidateId?: string;
}) {
  if (opts.interviewId) {
    revalidatePath(DASHBOARD_ROUTES.interviews.detail(opts.interviewId));
  }
  if (opts.candidateId) {
    revalidatePath(DASHBOARD_ROUTES.candidates.detail(opts.candidateId));
  }
  revalidatePath(DASHBOARD_ROUTES.feedback);
  revalidatePath(ROOT);
}

export function revalidatePosition(id?: string) {
  if (id) revalidatePath(DASHBOARD_ROUTES.positions.detail(id));
  revalidatePath(DASHBOARD_ROUTES.positions.list);
}

export function revalidateWorkflow(id?: string) {
  if (id) {
    revalidatePath(DASHBOARD_ROUTES.settings.workflows.detail(id));
  }
  revalidatePath(DASHBOARD_ROUTES.settings.workflows.list);
}

export function revalidateUser(id?: string) {
  if (id) revalidatePath(DASHBOARD_ROUTES.settings.users.edit(id));
  revalidatePath(DASHBOARD_ROUTES.settings.users.list);
  revalidatePath(DASHBOARD_ROUTES.profile);
}

export function revalidateSettings() {
  revalidatePath(DASHBOARD_ROUTES.settings.general);
}
