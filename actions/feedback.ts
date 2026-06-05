'use server';

import { AuthzError, isAdmin, requireSession } from '@/lib/authz';
import { db } from '@/lib/db';
import {
  CreateFeedbackSchema,
  UpdateFeedbackSchema,
  type CreateFeedbackInput,
  type UpdateFeedbackInput,
} from '@/lib/validations/dashboard';
import { revalidatePath } from 'next/cache';

import {
  createFeedback as createFeedbackData,
  deleteFeedback as deleteFeedbackData,
  updateFeedback as updateFeedbackData,
} from '@/data/feedback';

export async function createFeedback(input: CreateFeedbackInput) {
  const user = await requireSession();
  const data = CreateFeedbackSchema.parse(input);

  // Derive candidateId from the interview rather than trusting the client,
  // and verify the current user is an interviewer for it.
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
  if (!isInterviewer && !isAdmin(user)) {
    throw new AuthzError('Forbidden');
  }

  const feedback = await createFeedbackData({
    rating: data.rating,
    recommendation: data.recommendation,
    comment: data.comment ?? null,
    interviewId: interview.id,
    candidateId: interview.candidateId,
    interviewerId: user.id,
    skillAssessments: data.skillAssessments,
  });

  revalidatePath(`/dashboard/interviews/${feedback.interviewId}`);
  revalidatePath(`/dashboard/candidates/${feedback.candidateId}`);
  revalidatePath('/dashboard/feedback');
  revalidatePath('/dashboard');
  return feedback;
}

export async function updateFeedback(id: string, input: UpdateFeedbackInput) {
  const user = await requireSession();
  const data = UpdateFeedbackSchema.parse(input);

  const existing = await db.feedback.findUnique({
    where: { id },
    select: { id: true, interviewerId: true, interviewId: true, candidateId: true },
  });
  if (!existing) throw new AuthzError('Feedback not found');
  if (existing.interviewerId !== user.id && !isAdmin(user)) {
    throw new AuthzError('Forbidden');
  }

  const feedback = await updateFeedbackData(id, {
    rating: data.rating,
    recommendation: data.recommendation,
    comment: data.comment ?? null,
    skillAssessments: data.skillAssessments,
  });

  revalidatePath(`/dashboard/interviews/${feedback.interviewId}`);
  revalidatePath(`/dashboard/candidates/${feedback.candidateId}`);
  revalidatePath(`/dashboard/feedback/${id}`);
  revalidatePath('/dashboard/feedback');
  revalidatePath('/dashboard');
  return feedback;
}

export async function deleteFeedback(id: string) {
  const user = await requireSession();

  const existing = await db.feedback.findUnique({
    where: { id },
    select: { id: true, interviewerId: true, interviewId: true, candidateId: true },
  });
  if (!existing) throw new AuthzError('Feedback not found');
  if (existing.interviewerId !== user.id && !isAdmin(user)) {
    throw new AuthzError('Forbidden');
  }

  await deleteFeedbackData(id);

  revalidatePath(`/dashboard/interviews/${existing.interviewId}`);
  revalidatePath(`/dashboard/candidates/${existing.candidateId}`);
  revalidatePath('/dashboard/feedback');
  revalidatePath('/dashboard');
  return true;
}
