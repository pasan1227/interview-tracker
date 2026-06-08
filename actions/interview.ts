'use server';

import {
  createInterview as createInterviewData,
  deleteInterview as deleteInterviewData,
  updateInterview as updateInterviewData,
} from '@/data/interview';
import { enqueueInterviewEffect } from '@/effects/interview-mail';
import {
  AuthzError,
  isOrgManagerOrAdmin,
  requireOrgManagerOrAdmin,
  requireOrgSession,
  toOrgContext,
  type ActiveOrgUser,
} from '@/lib/authz';
import { InterviewStatus } from '@/lib/generated/prisma/browser';
import { revalidateInterview } from '@/lib/revalidate';
import { tenantDb } from '@/lib/tenant-db';
import {
  CreateInterviewSchema,
  InterviewStatusSchema,
  UpdateInterviewSchema,
  type CreateInterviewInput,
  type UpdateInterviewInput,
} from '@/lib/validations/dashboard';

// ---------- Authorization ----------
// Anyone authenticated in the org can create. Mutations require
// ADMIN/MANAGER, or the creator, or someone listed as an interviewer.
async function authorizeInterviewMutation(interviewId: string) {
  const user = await requireOrgSession();
  const ctx = toOrgContext(user);
  const db = tenantDb(ctx);

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
    isOrgManagerOrAdmin(user) ||
    interview.createdById === user.id ||
    interview.interviewers.some((i) => i.id === user.id);
  if (!allowed) throw new AuthzError('Forbidden');

  return { user: user as ActiveOrgUser, ctx, interview };
}

// ---------- Actions ----------

export async function createInterview(input: CreateInterviewInput) {
  // Scheduling fans out emails to arbitrary user IDs (`interviewerIds`),
  // so it stays manager/admin only. INTERVIEWER role still submits
  // feedback via actions/feedback.ts.
  const user = await requireOrgManagerOrAdmin();
  const ctx = toOrgContext(user);
  const data = CreateInterviewSchema.parse(input);

  // Verify candidate is in our org. tenantDb returns null cross-org.
  const db = tenantDb(ctx);
  const candidate = await db.candidate.findUnique({
    where: { id: data.candidateId },
    select: { id: true },
  });
  if (!candidate) throw new AuthzError('Candidate not found');

  const interview = await createInterviewData(ctx, {
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
    organizationId: ctx.organizationId,
    createdById: user.id,
    interviewers: {
      connect: data.interviewerIds.map((id) => ({ id })),
    },
  });

  enqueueInterviewEffect({ type: 'created', interviewId: interview.id });

  revalidateInterview({ candidateId: data.candidateId });
  return interview;
}

export async function updateInterview(id: string, input: UpdateInterviewInput) {
  const { user, ctx, interview: current } = await authorizeInterviewMutation(id);
  const parsed = UpdateInterviewSchema.parse(input);

  // Privilege ceiling: only manager/admin can touch scheduling,
  // assignment, or candidate/position pointers. A listed interviewer
  // who could otherwise edit notes was previously able to reassign the
  // interview to a different candidate, swap interviewer rosters, or
  // re-trigger mass schedule emails. Restrict their writable surface
  // to notes + status. (Status-spam via repeated SCHEDULED transitions
  // is a separate ticket — S8 in the audit.)
  const data: UpdateInterviewInput = isOrgManagerOrAdmin(user)
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

  const interview = await updateInterviewData(ctx, id, updateData);

  if (data.status && data.status !== current.status) {
    enqueueInterviewEffect({
      type: 'status-changed',
      interviewId: id,
      newStatus: data.status,
    });
  }

  revalidateInterview({ id, candidateId: interview.candidateId });
  return interview;
}

export async function deleteInterview(id: string) {
  // Tighter than authorizeInterviewMutation: a listed interviewer can
  // edit notes/status (see updateInterview) but should not be able to
  // destroy the record outright. Manager/admin and the original creator
  // only.
  const { user, ctx, interview } = await authorizeInterviewMutation(id);
  const canDelete =
    isOrgManagerOrAdmin(user) || interview.createdById === user.id;
  if (!canDelete) throw new AuthzError('Forbidden');

  await deleteInterviewData(ctx, id);

  revalidateInterview({ candidateId: interview.candidateId });
  return true;
}

export async function updateInterviewStatus(id: string, status: string) {
  const { status: parsed } = InterviewStatusSchema.parse({ status });
  const { ctx, interview: current } = await authorizeInterviewMutation(id);

  const interview = await updateInterviewData(ctx, id, { status: parsed });

  // Only fire the status-change emails on an actual transition. Without
  // this guard, repeated "Mark as completed" clicks (or any no-op
  // status write) would spam reminder/schedule emails — once each click.
  if (parsed !== current.status) {
    enqueueInterviewEffect({
      type: 'status-changed',
      interviewId: id,
      newStatus: parsed,
    });
  }

  revalidateInterview({ id, candidateId: interview.candidateId });
  return interview;
}

// Email side-effects live in @/effects/interview-mail.ts.
