'use server';

import {
  createCandidate as createCandidateData,
  deleteCandidate as deleteCandidateData,
  updateCandidate as updateCandidateData,
} from '@/data/candidate';
import { requireManagerOrAdmin } from '@/lib/authz';
import { db } from '@/lib/db';
import {
  CreateCandidateSchema,
  UpdateCandidateSchema,
  UpdateCandidateStatusSchema,
  type CreateCandidateInput,
  type UpdateCandidateInput,
} from '@/lib/validations/dashboard';
import { revalidatePath } from 'next/cache';

export async function createCandidate(input: CreateCandidateInput) {
  const user = await requireManagerOrAdmin();
  const data = CreateCandidateSchema.parse(input);
  const { notes, ...candidateFields } = data;

  const candidate = await createCandidateData({
    ...candidateFields,
    resumeUrl: emptyToNull(candidateFields.resumeUrl),
    createdById: user.id,
  });

  if (notes) {
    await db.note.create({ data: { content: notes, candidateId: candidate.id } });
  }

  revalidatePath('/dashboard/candidates');
  revalidatePath('/dashboard');
  return candidate;
}

export async function updateCandidate(id: string, input: UpdateCandidateInput) {
  await requireManagerOrAdmin();
  const data = UpdateCandidateSchema.parse(input);
  const { notes, ...candidateFields } = data;

  const candidate = await updateCandidateData(id, {
    ...candidateFields,
    resumeUrl:
      candidateFields.resumeUrl === undefined
        ? undefined
        : emptyToNull(candidateFields.resumeUrl),
  });

  if (notes) {
    await db.note.create({ data: { content: notes, candidateId: id } });
  }

  revalidatePath(`/dashboard/candidates/${id}`);
  revalidatePath('/dashboard/candidates');
  revalidatePath('/dashboard');
  return candidate;
}

export async function deleteCandidate(id: string) {
  await requireManagerOrAdmin();

  await deleteCandidateData(id);

  revalidatePath('/dashboard/candidates');
  revalidatePath('/dashboard');
  return true;
}

export async function addCandidateNote(candidateId: string, content: string) {
  await requireManagerOrAdmin();
  const trimmed = content.trim();
  if (!trimmed) throw new Error('Note cannot be empty');
  if (trimmed.length > 10_000) throw new Error('Note is too long');

  const note = await db.note.create({
    data: { content: trimmed, candidateId },
  });

  revalidatePath(`/dashboard/candidates/${candidateId}`);
  return note;
}

export async function updateCandidateStatus(id: string, status: string) {
  await requireManagerOrAdmin();
  const { status: parsed } = UpdateCandidateStatusSchema.parse({ status });

  const candidate = await updateCandidateData(id, { status: parsed });

  revalidatePath(`/dashboard/candidates/${id}`);
  revalidatePath('/dashboard/candidates');
  revalidatePath('/dashboard');
  return candidate;
}

function emptyToNull<T extends string | null | undefined>(v: T) {
  return v === '' || v == null ? null : v;
}
