'use server';

import {
  createCandidate as createCandidateData,
  deleteCandidate as deleteCandidateData,
  updateCandidate as updateCandidateData,
} from '@/data/candidate';
import { requireManagerOrAdmin } from '@/lib/authz';
import { db } from '@/lib/db';
import { getDefaultOrganizationId } from '@/lib/default-org';
import { revalidateCandidate } from '@/lib/revalidate';
import {
  CreateCandidateSchema,
  UpdateCandidateSchema,
  UpdateCandidateStatusSchema,
  type CreateCandidateInput,
  type UpdateCandidateInput,
} from '@/lib/validations/dashboard';
import * as z from 'zod';

export async function createCandidate(input: CreateCandidateInput) {
  const user = await requireManagerOrAdmin();
  const data = CreateCandidateSchema.parse(input);
  const { notes, ...candidateFields } = data;
  // Bridge until PR 6 threads OrgContext through this action.
  const organizationId = await getDefaultOrganizationId();

  const candidate = await createCandidateData({
    ...candidateFields,
    resumeUrl: emptyToNull(candidateFields.resumeUrl),
    createdById: user.id,
    organizationId,
  });

  if (notes) {
    await db.note.create({
      data: { content: notes, candidateId: candidate.id, organizationId },
    });
  }

  revalidateCandidate();
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
    // Reuse the candidate's tenant — the note inherits it. Bridge
    // until PR 6 threads OrgContext through this action.
    await db.note.create({
      data: {
        content: notes,
        candidateId: id,
        organizationId: candidate.organizationId,
      },
    });
  }

  revalidateCandidate(id);
  return candidate;
}

export async function deleteCandidate(id: string) {
  await requireManagerOrAdmin();

  await deleteCandidateData(id);

  revalidateCandidate();
  return true;
}

export async function addCandidateNote(candidateId: string, content: string) {
  await requireManagerOrAdmin();
  // Validate candidateId shape before letting it reach Prisma, then
  // confirm the candidate actually exists. Without these, the action
  // accepted any arbitrary string and silently failed via the FK
  // constraint, which is fine in practice but means a typo'd
  // candidateId from the client produces an opaque DB error.
  const cuidParse = z.string().cuid().safeParse(candidateId);
  if (!cuidParse.success) throw new Error('Invalid candidate ID');
  const exists = await db.candidate.findUnique({
    where: { id: candidateId },
    select: { id: true, organizationId: true },
  });
  if (!exists) throw new Error('Candidate not found');

  const trimmed = content.trim();
  if (!trimmed) throw new Error('Note cannot be empty');
  if (trimmed.length > 10_000) throw new Error('Note is too long');

  const note = await db.note.create({
    data: {
      content: trimmed,
      candidateId,
      organizationId: exists.organizationId,
    },
  });

  revalidateCandidate(candidateId);
  return note;
}

export async function updateCandidateStatus(id: string, status: string) {
  await requireManagerOrAdmin();
  const { status: parsed } = UpdateCandidateStatusSchema.parse({ status });

  const candidate = await updateCandidateData(id, { status: parsed });

  revalidateCandidate(id);
  return candidate;
}

function emptyToNull<T extends string | null | undefined>(v: T) {
  return v === '' || v == null ? null : v;
}
