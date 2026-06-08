'use server';

import {
  createCandidate as createCandidateData,
  deleteCandidate as deleteCandidateData,
  updateCandidate as updateCandidateData,
} from '@/data/candidate';
import { requireOrgManagerOrAdmin, toOrgContext } from '@/lib/authz';
import { tenantDb } from '@/lib/tenant-db';
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
  const user = await requireOrgManagerOrAdmin();
  const ctx = toOrgContext(user);
  const data = CreateCandidateSchema.parse(input);
  const { notes, ...candidateFields } = data;

  const candidate = await createCandidateData(ctx, {
    ...candidateFields,
    resumeUrl: emptyToNull(candidateFields.resumeUrl),
    createdById: user.id,
  });

  if (notes) {
    // organizationId is auto-injected at runtime by tenantDb, but
    // Prisma's static types still demand it — pass it explicitly so
    // the call compiles. (The extension's injectOrgIntoCreateData
    // skips when the field is already present.)
    await tenantDb(ctx).note.create({
      data: {
        content: notes,
        candidateId: candidate.id,
        organizationId: ctx.organizationId,
      },
    });
  }

  revalidateCandidate();
  return candidate;
}

export async function updateCandidate(id: string, input: UpdateCandidateInput) {
  const user = await requireOrgManagerOrAdmin();
  const ctx = toOrgContext(user);
  const data = UpdateCandidateSchema.parse(input);
  const { notes, ...candidateFields } = data;

  const candidate = await updateCandidateData(ctx, id, {
    ...candidateFields,
    resumeUrl:
      candidateFields.resumeUrl === undefined
        ? undefined
        : emptyToNull(candidateFields.resumeUrl),
  });

  if (notes) {
    await tenantDb(ctx).note.create({
      data: {
        content: notes,
        candidateId: id,
        organizationId: ctx.organizationId,
      },
    });
  }

  revalidateCandidate(id);
  return candidate;
}

export async function deleteCandidate(id: string) {
  const user = await requireOrgManagerOrAdmin();
  const ctx = toOrgContext(user);

  await deleteCandidateData(ctx, id);

  revalidateCandidate();
  return true;
}

export async function addCandidateNote(candidateId: string, content: string) {
  const user = await requireOrgManagerOrAdmin();
  const ctx = toOrgContext(user);

  // Validate candidateId shape before letting it reach Prisma. The
  // tenant-scoped findUnique below returns null if the candidate
  // exists but belongs to another org — never leaking its existence.
  const cuidParse = z.string().cuid().safeParse(candidateId);
  if (!cuidParse.success) throw new Error('Invalid candidate ID');

  const db = tenantDb(ctx);
  const exists = await db.candidate.findUnique({
    where: { id: candidateId },
    select: { id: true },
  });
  if (!exists) throw new Error('Candidate not found');

  const trimmed = content.trim();
  if (!trimmed) throw new Error('Note cannot be empty');
  if (trimmed.length > 10_000) throw new Error('Note is too long');

  const note = await db.note.create({
    data: {
      content: trimmed,
      candidateId,
      organizationId: ctx.organizationId,
    },
  });

  revalidateCandidate(candidateId);
  return note;
}

export async function updateCandidateStatus(id: string, status: string) {
  const user = await requireOrgManagerOrAdmin();
  const ctx = toOrgContext(user);
  const { status: parsed } = UpdateCandidateStatusSchema.parse({ status });

  const candidate = await updateCandidateData(ctx, id, { status: parsed });

  revalidateCandidate(id);
  return candidate;
}

function emptyToNull<T extends string | null | undefined>(v: T) {
  return v === '' || v == null ? null : v;
}
