// packages/storage/src/presign.ts
//
// Presigned PUT and GET URLs. Phase 1 uses PUT-style direct upload
// (single-part). Multipart upload comes in Phase 3 when we need to
// accept large recordings; for now ~50MB max is fine.
//
// Two safety constraints baked in:
//   1. URLs are short-lived (15 min default for PUT, 5 min for GET).
//   2. PUT URLs require Content-Length and Content-Type matching the
//      request the client made — prevents an attacker from replaying
//      a URL to upload a different (e.g. larger) payload.

import {
  GetObjectCommand,
  PutObjectCommand,
  type PutObjectCommandInput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getBucket, getStorageClient } from './client';

export type PresignPutArgs = {
  key: string;
  contentType: string;
  contentLength: number;
  // Soft cap — refuse if the requested size exceeds this. Defaults to
  // 50 MB, override per upload kind (resumes are tiny, voice
  // recordings can be 100 MB+).
  maxBytes?: number;
  // Tags applied to the object — useful for lifecycle policies.
  metadata?: Record<string, string>;
  // URL TTL in seconds. Default 15 min.
  expiresInSec?: number;
};

const DEFAULT_PUT_EXPIRES = 60 * 15;
const DEFAULT_GET_EXPIRES = 60 * 5;
const DEFAULT_MAX_BYTES = 50 * 1024 * 1024;

export async function presignPut(args: PresignPutArgs): Promise<{
  url: string;
  // Headers the client MUST send with the PUT request. Anything else
  // will fail signature verification.
  headers: Record<string, string>;
}> {
  const maxBytes = args.maxBytes ?? DEFAULT_MAX_BYTES;
  if (args.contentLength > maxBytes) {
    throw new Error(
      `presignPut: contentLength ${args.contentLength} exceeds max ${maxBytes}`
    );
  }

  const input: PutObjectCommandInput = {
    Bucket: getBucket(),
    Key: args.key,
    ContentType: args.contentType,
    ContentLength: args.contentLength,
    Metadata: args.metadata,
  };

  const cmd = new PutObjectCommand(input);
  const url = await getSignedUrl(getStorageClient(), cmd, {
    expiresIn: args.expiresInSec ?? DEFAULT_PUT_EXPIRES,
  });

  return {
    url,
    headers: {
      'Content-Type': args.contentType,
      'Content-Length': String(args.contentLength),
    },
  };
}

export async function presignGet(
  key: string,
  expiresInSec: number = DEFAULT_GET_EXPIRES
): Promise<string> {
  const cmd = new GetObjectCommand({
    Bucket: getBucket(),
    Key: key,
  });
  return getSignedUrl(getStorageClient(), cmd, { expiresIn: expiresInSec });
}
