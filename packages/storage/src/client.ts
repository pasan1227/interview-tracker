// packages/storage/src/client.ts
//
// S3-compatible client. Configured for Cloudflare R2 by default (free
// egress, S3 API). AWS S3 works without modification — set
// STORAGE_ENDPOINT to the regional endpoint.
//
// For R2: STORAGE_ENDPOINT looks like https://<account>.r2.cloudflarestorage.com
// For AWS: leave STORAGE_ENDPOINT empty; the SDK constructs it from STORAGE_REGION.

import { S3Client } from '@aws-sdk/client-s3';

let _client: S3Client | null = null;

export function getStorageClient(): S3Client {
  if (_client) return _client;
  const region = process.env.STORAGE_REGION ?? 'auto';
  const accessKeyId = process.env.STORAGE_ACCESS_KEY_ID;
  const secretAccessKey = process.env.STORAGE_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      '[hiring-os/storage] STORAGE_ACCESS_KEY_ID and STORAGE_SECRET_ACCESS_KEY are required.'
    );
  }
  _client = new S3Client({
    region,
    endpoint: process.env.STORAGE_ENDPOINT || undefined,
    // R2 requires path-style URLs for some operations; safe everywhere
    // and a no-op for AWS in modern SDKs.
    forcePathStyle: Boolean(process.env.STORAGE_ENDPOINT),
    credentials: { accessKeyId, secretAccessKey },
  });
  return _client;
}

export function getBucket(): string {
  const bucket = process.env.STORAGE_BUCKET;
  if (!bucket) {
    throw new Error('[hiring-os/storage] STORAGE_BUCKET is required.');
  }
  return bucket;
}
