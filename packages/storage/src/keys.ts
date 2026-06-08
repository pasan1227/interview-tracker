// packages/storage/src/keys.ts
//
// Tenant-prefixed key generation. EVERY storage key starts with
// `org/{orgId}/` so a leaked signed URL can't be replayed against
// another tenant's prefix even if the bucket policy were misconfigured.

import { randomUUID } from 'node:crypto';

export type StorageOwner =
  | { kind: 'candidate'; candidateId: string }
  | { kind: 'application'; applicationId: string }
  | { kind: 'interview'; interviewId: string }
  | { kind: 'offer'; offerId: string }
  | { kind: 'organization' };

export function buildKey(
  organizationId: string,
  owner: StorageOwner,
  filename: string
): string {
  const safeName = filename
    .normalize('NFKD')
    .replace(/[^\w.\-+ ]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 120);
  const id = randomUUID();
  const ownerPath = ownerToPath(owner);
  return `org/${organizationId}/${ownerPath}/${id}/${safeName}`;
}

function ownerToPath(owner: StorageOwner): string {
  switch (owner.kind) {
    case 'candidate':
      return `candidates/${owner.candidateId}`;
    case 'application':
      return `applications/${owner.applicationId}`;
    case 'interview':
      return `interviews/${owner.interviewId}`;
    case 'offer':
      return `offers/${owner.offerId}`;
    case 'organization':
      return 'organization';
  }
}

// Validate a key belongs to an org. Use this whenever a key arrives
// from the client (e.g. after a presigned-upload completion ping).
export function assertKeyForOrg(key: string, organizationId: string): void {
  const prefix = `org/${organizationId}/`;
  if (!key.startsWith(prefix)) {
    throw new Error(`Storage key ${key} not in org ${organizationId} prefix`);
  }
}
