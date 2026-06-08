// packages/storage/src/attachments.ts
//
// High-level workflow: request a presigned upload + create the
// Attachment row in one step. The row is created with status
// PENDING_UPLOAD; the client confirms completion via
// confirmAttachmentUpload() which flips to UPLOADED (and triggers
// virus scan in Phase 8).

import { db, type OrgContext, tenantDb } from '@hiring-os/db';
import { presignPut } from './presign';
import { buildKey, assertKeyForOrg, type StorageOwner } from './keys';

export type CreateUploadArgs = {
  ctx: OrgContext;
  owner: StorageOwner;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  maxBytes?: number;
};

export type CreateUploadResult = {
  attachmentId: string;
  storageKey: string;
  putUrl: string;
  putHeaders: Record<string, string>;
};

const OWNER_TYPE_MAP = {
  candidate: 'CANDIDATE',
  application: 'APPLICATION',
  interview: 'INTERVIEW',
  offer: 'OFFER',
  organization: 'ORGANIZATION',
} as const;

const OWNER_ID_KEYS = {
  candidate: 'candidateId',
  application: 'applicationId',
  interview: 'interviewId',
  offer: 'offerId',
  organization: null,
} as const;

export async function createUpload(
  args: CreateUploadArgs
): Promise<CreateUploadResult> {
  const { ctx, owner, filename, mimeType, sizeBytes, maxBytes } = args;
  const key = buildKey(ctx.organizationId, owner, filename);

  const presigned = await presignPut({
    key,
    contentType: mimeType,
    contentLength: sizeBytes,
    maxBytes,
  });

  const ownerIdKey = OWNER_ID_KEYS[owner.kind];
  const ownerId =
    ownerIdKey == null
      ? ctx.organizationId
      : ((owner as unknown as Record<string, string>)[ownerIdKey] as string);

  const tdb = tenantDb(ctx);
  const attachment = await tdb.attachment.create({
    data: {
      ownerType: OWNER_TYPE_MAP[owner.kind],
      ownerId,
      filename,
      mimeType,
      sizeBytes,
      storageKey: key,
      uploadedById: ctx.userId,
      status: 'PENDING_UPLOAD',
    },
    select: { id: true },
  });

  return {
    attachmentId: attachment.id,
    storageKey: key,
    putUrl: presigned.url,
    putHeaders: presigned.headers,
  };
}

// Client calls this after the PUT completes. Flips the row to
// UPLOADED. Phase 8 will hook a `scan-attachment` queue here.
export async function confirmAttachmentUpload(
  ctx: OrgContext,
  attachmentId: string
): Promise<void> {
  const tdb = tenantDb(ctx);
  const row = await tdb.attachment.findFirst({
    where: { id: attachmentId },
    select: { storageKey: true },
  });
  if (!row) throw new Error('Attachment not found');
  assertKeyForOrg(row.storageKey, ctx.organizationId);
  await tdb.attachment.update({
    where: { id: attachmentId },
    data: { status: 'UPLOADED' },
  });
}

// Use this to read an attachment from the UI — never expose raw S3
// keys to the browser.
export async function getDownloadUrl(
  ctx: OrgContext,
  attachmentId: string
): Promise<string> {
  const tdb = tenantDb(ctx);
  const row = await tdb.attachment.findFirst({
    where: { id: attachmentId },
    select: { storageKey: true },
  });
  if (!row) throw new Error('Attachment not found');
  const { presignGet } = await import('./presign.js');
  return presignGet(row.storageKey);
}

// Touch db so prisma client is referenced (silences "unused" lint when
// tree-shaken by callers).
void db;
