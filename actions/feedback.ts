'use server';

import { AuthzError, isOrgAdmin, requireOrgSession, toOrgContext } from '@/lib/authz';
import { tenantDb } from '@/lib/tenant-db';
import { revalidateFeedback } from '@/lib/revalidate';
import {
  CreateFeedbackSchema,
  UpdateFeedbackSchema,
  type CreateFeedbackInput,
  type UpdateFeedbackInput,
} from '@/lib/validations/dashboard';

import {
  createFeedback as createFeedbackData,
  deleteFeedback as deleteFeedbackData,
  updateFeedback as updateFeedbackData,
} from '@/data/feedback';

export async function createFeedback(input: CreateFeedbackInput) {
  const user = await requireOrgSession();
  const ctx = toOrgContext(user);
  const data = CreateFeedbackSchema.parse(input);

  // Derive candidateId from the interview rather than trusting the
  // client. Lookup is org-scoped through tenantDb — picking an
  // interview from another org returns null and surfaces as "not
  // found" rather than leaking existence.
  const db = tenantDb(ctx);
  const interview = await db.interview.findUnique({
    where: { id: data.interviewId },
    select: {
      id: true,
      candidateId: true,
      interviewers: { select: { id: true } },
    },
  });
  if (!interview) throw new AuthzError('Interview not found');

  const isInterviewer = interview.interviewers.some((i) => i.id === user.id);
  if (!isInterviewer && !isOrgAdmin(user)) {
    throw new AuthzError('Forbidden');
  }

  const feedback = await createFeedbackData(ctx, {
    rating: data.rating,
    recommendation: data.recommendation,
    comment: data.comment ?? null,
    interviewId: interview.id,
    candidateId: interview.candidateId,
    interviewerId: user.id,
    organizationId: ctx.organizationId,
    skillAssessments: data.skillAssessments,
  });

  revalidateFeedback({
    interviewId: feedback.interviewId,
    candidateId: feedback.candidateId,
  });
  return feedback;
}

export async function updateFeedback(id: string, input: UpdateFeedbackInput) {
  const user = await requireOrgSession();
  const ctx = toOrgContext(user);
  const data = UpdateFeedbackSchema.parse(input);

  const db = tenantDb(ctx);
  const existing = await db.feedback.findUnique({
    where: { id },
    select: { id: true, interviewerId: true, interviewId: true, candidateId: true },
  });
  if (!existing) throw new AuthzError('Feedback not found');
  if (existing.interviewerId !== user.id && !isOrgAdmin(user)) {
    throw new AuthzError('Forbidden');
  }

  const feedback = await updateFeedbackData(ctx, id, {
    rating: data.rating,
    recommendation: data.recommendation,
    comment: data.comment ?? null,
    skillAssessments: data.skillAssessments,
  });

  revalidateFeedback({
    feedbackId: id,
    interviewId: feedback.interviewId,
    candidateId: feedback.candidateId,
  });
  return feedback;
}

export async function deleteFeedback(id: string) {
  const user = await requireOrgSession();
  const ctx = toOrgContext(user);

  const db = tenantDb(ctx);
  const existing = await db.feedback.findUnique({
    where: { id },
    select: { id: true, interviewerId: true, interviewId: true, candidateId: true },
  });
  if (!existing) throw new AuthzError('Feedback not found');
  if (existing.interviewerId !== user.id && !isOrgAdmin(user)) {
    throw new AuthzError('Forbidden');
  }

  await deleteFeedbackData(ctx, id);

  revalidateFeedback({
    interviewId: existing.interviewId,
    candidateId: existing.candidateId,
  });
  return true;
}
