// apps/web/app/api/uploads/presign/route.ts
//
// POST /api/uploads/presign
//
// Body: { owner: StorageOwner, filename, mimeType, sizeBytes }
//
// Returns: { attachmentId, storageKey, putUrl, putHeaders }
//
// The client then PUTs the file directly to S3/R2 using putUrl +
// putHeaders, and finally POSTs to /api/uploads/confirm/:id to flip
// the Attachment row to UPLOADED.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOrgSession, toOrgContext, AuthzError } from '@/lib/authz';
import { createUpload, type StorageOwner } from '@hiring-os/storage';

const OwnerSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('candidate'), candidateId: z.string() }),
  z.object({ kind: z.literal('application'), applicationId: z.string() }),
  z.object({ kind: z.literal('interview'), interviewId: z.string() }),
  z.object({ kind: z.literal('offer'), offerId: z.string() }),
  z.object({ kind: z.literal('organization') }),
]);

const BodySchema = z.object({
  owner: OwnerSchema,
  filename: z.string().min(1).max(200),
  mimeType: z.string().min(1).max(200),
  sizeBytes: z.number().int().positive().max(50 * 1024 * 1024),
});

export async function POST(req: Request) {
  try {
    const user = await requireOrgSession();
    const json = await req.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', details: parsed.error.issues },
        { status: 400 }
      );
    }
    const result = await createUpload({
      ctx: toOrgContext(user),
      owner: parsed.data.owner as StorageOwner,
      filename: parsed.data.filename,
      mimeType: parsed.data.mimeType,
      sizeBytes: parsed.data.sizeBytes,
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AuthzError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error('[presign]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
