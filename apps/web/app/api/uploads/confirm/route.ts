// apps/web/app/api/uploads/confirm/route.ts
//
// POST /api/uploads/confirm
// Body: { attachmentId }
//
// Flips the Attachment row from PENDING_UPLOAD to UPLOADED after the
// client's direct PUT succeeds. In Phase 8 this also enqueues the
// virus scan job.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOrgSession, toOrgContext, AuthzError } from '@/lib/authz';
import { confirmAttachmentUpload } from '@hiring-os/storage';

const BodySchema = z.object({
  attachmentId: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const user = await requireOrgSession();
    const json = await req.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }
    await confirmAttachmentUpload(toOrgContext(user), parsed.data.attachmentId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthzError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error('[confirm-upload]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
