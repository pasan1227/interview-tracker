'use server';

import {
  createInterview as createInterviewData,
  deleteInterview as deleteInterviewData,
  getInterviewForEmails,
  updateInterview as updateInterviewData,
} from '@/data/interview';
import {
  AuthzError,
  isManagerOrAdmin,
  requireManagerOrAdmin,
  requireSession,
} from '@/lib/authz';
import { db } from '@/lib/db';
import { InterviewStatus } from '@/lib/generated/prisma/browser';
import {
  sendFeedbackReminderEmail,
  sendInterviewScheduleEmail,
  sendNewInterviewNotifications,
} from '@/lib/mail';
import {
  CreateInterviewSchema,
  InterviewStatusSchema,
  UpdateInterviewSchema,
  type CreateInterviewInput,
  type UpdateInterviewInput,
} from '@/lib/validations/dashboard';
import { revalidatePath } from 'next/cache';

// ---------- Authorization ----------
// Anyone authenticated can create. Mutations require ADMIN/MANAGER, or the
// creator, or someone listed as an interviewer.
async function authorizeInterviewMutation(interviewId: string) {
  const user = await requireSession();
  const interview = await db.interview.findUnique({
    where: { id: interviewId },
    select: {
      id: true,
      createdById: true,
      candidateId: true,
      status: true,
      interviewers: { select: { id: true } },
    },
  });
  if (!interview) throw new AuthzError('Interview not found');

  const allowed =
    isManagerOrAdmin(user) ||
    interview.createdById === user.id ||
    interview.interviewers.some((i) => i.id === user.id);
  if (!allowed) throw new AuthzError('Forbidden');

  return { user, interview };
}

// ---------- Actions ----------

export async function createInterview(input: CreateInterviewInput) {
  // Scheduling fans out emails to arbitrary user IDs (`interviewerIds`),
  // so it stays manager/admin only. INTERVIEWER role still submits
  // feedback via actions/feedback.ts.
  const user = await requireManagerOrAdmin();
  const data = CreateInterviewSchema.parse(input);

  const interview = await createInterviewData({
    title: data.title,
    startTime: data.startTime,
    endTime: data.endTime,
    location: data.location ?? null,
    notes: data.notes ?? null,
    type: data.type,
    status: data.status ?? InterviewStatus.SCHEDULED,
    candidateId: data.candidateId,
    positionId: data.positionId,
    stageId: data.stageId ?? null,
    createdById: user.id,
    interviewers: {
      connect: data.interviewerIds.map((id) => ({ id })),
    },
  });

  const complete = await getInterviewForEmails(interview.id);
  if (complete) await sendNewInterviewNotifications(complete);

  revalidatePath('/dashboard/interviews');
  revalidatePath(`/dashboard/candidates/${data.candidateId}`);
  revalidatePath('/dashboard');
  return interview;
}

export async function updateInterview(id: string, input: UpdateInterviewInput) {
  const { user, interview: current } = await authorizeInterviewMutation(id);
  const parsed = UpdateInterviewSchema.parse(input);

  // Privilege ceiling: only manager/admin can touch scheduling,
  // assignment, or candidate/position pointers. A listed interviewer
  // who could otherwise edit notes was previously able to reassign the
  // interview to a different candidate, swap interviewer rosters, or
  // re-trigger mass schedule emails. Restrict their writable surface
  // to notes + status. (Status-spam via repeated SCHEDULED transitions
  // is a separate ticket — S8 in the audit.)
  const data: UpdateInterviewInput = isManagerOrAdmin(user)
    ? parsed
    : {
        ...(parsed.notes !== undefined && { notes: parsed.notes }),
        ...(parsed.status !== undefined && { status: parsed.status }),
      };

  const { interviewerIds, ...rest } = data;
  const updateData: Record<string, unknown> = { ...rest };
  if ('location' in rest) updateData.location = rest.location ?? undefined;
  if ('notes' in rest) updateData.notes = rest.notes ?? undefined;
  if ('stageId' in rest) updateData.stageId = rest.stageId ?? undefined;
  if (interviewerIds) {
    updateData.interviewers = { set: interviewerIds.map((id) => ({ id })) };
  }

  const interview = await updateInterviewData(id, updateData);

  if (data.status && data.status !== current.status) {
    await handleStatusChangeEmails(id, data.status);
  }

  revalidatePath(`/dashboard/interviews/${id}`);
  revalidatePath('/dashboard/interviews');
  if (interview.candidateId) {
    revalidatePath(`/dashboard/candidates/${interview.candidateId}`);
  }
  revalidatePath('/dashboard');
  return interview;
}

export async function deleteInterview(id: string) {
  const { interview } = await authorizeInterviewMutation(id);

  await deleteInterviewData(id);

  revalidatePath('/dashboard/interviews');
  revalidatePath(`/dashboard/candidates/${interview.candidateId}`);
  revalidatePath('/dashboard');
  return true;
}

export async function updateInterviewStatus(id: string, status: string) {
  const { status: parsed } = InterviewStatusSchema.parse({ status });
  const { interview: current } = await authorizeInterviewMutation(id);

  const interview = await updateInterviewData(id, { status: parsed });

  // Only fire the status-change emails on an actual transition. Without
  // this guard, repeated "Mark as completed" clicks (or any no-op
  // status write) would spam reminder/schedule emails — once each click.
  if (parsed !== current.status) {
    await handleStatusChangeEmails(id, parsed);
  }

  revalidatePath(`/dashboard/interviews/${id}`);
  revalidatePath('/dashboard/interviews');
  if (interview.candidateId) {
    revalidatePath(`/dashboard/candidates/${interview.candidateId}`);
  }
  revalidatePath('/dashboard');
  return interview;
}

async function setStatusFromForm(formData: FormData, status: InterviewStatus) {
  const interviewId = formData.get('interviewId');
  if (typeof interviewId !== 'string' || !interviewId) {
    throw new Error('Interview ID is required');
  }
  await updateInterviewStatus(interviewId, status);
  return { success: true };
}

export async function markInterviewAsCompleted(formData: FormData) {
  return setStatusFromForm(formData, InterviewStatus.COMPLETED);
}

export async function markInterviewAsCanceled(formData: FormData) {
  return setStatusFromForm(formData, InterviewStatus.CANCELED);
}

export async function markInterviewAsNoShow(formData: FormData) {
  return setStatusFromForm(formData, InterviewStatus.NO_SHOW);
}

// ---------- Email side-effects ----------
// Email failures are logged but never block the mutation.
async function handleStatusChangeEmails(interviewId: string, newStatus: InterviewStatus) {
  try {
    const interview = await getInterviewForEmails(interviewId);
    if (!interview) return;

    if (newStatus === InterviewStatus.COMPLETED) {
      await Promise.all(
        interview.interviewers
          .filter((i) => i.email)
          .map((interviewer) =>
            sendFeedbackReminderEmail({
              to: interviewer.email!,
              interviewerName: interviewer.name ?? '',
              candidateName: interview.candidate.name,
              interviewTitle: interview.title,
              interviewDateTime: interview.startTime,
              interviewId,
            })
          )
      );
      return;
    }

    if (newStatus === InterviewStatus.SCHEDULED) {
      const interviewerNames = interview.interviewers.map((i) => i.name ?? '');
      const scheduleArgs = {
        candidateName: interview.candidate.name,
        interviewTitle: interview.title,
        interviewDateTime: interview.startTime,
        interviewerNames,
        location: interview.location ?? undefined,
        notes: interview.notes ?? undefined,
      };
      const recipients = [
        ...interview.interviewers.filter((i) => i.email).map((i) => i.email!),
        ...(interview.candidate.email ? [interview.candidate.email] : []),
      ];
      await Promise.all(
        recipients.map((to) => sendInterviewScheduleEmail({ to, ...scheduleArgs }))
      );
    }
  } catch (error) {
    console.error('Error sending status change emails:', error);
  }
}
