// packages/api-auth/src/tokens.ts
//
// Personal Access Token (PAT) issuance + verification.
//
// Token format: htop_<24 base32 chars>
// - "htop" = Hiring OS Token Prefix (one-look identification of the
//   kind of secret when it shows up in a leaked log)
// - 24 b32 chars = 120 bits of entropy. Sufficient and easy to copy.
//
// Storage: we store SHA-256(rawToken) in tokenHash, plus a prefix
// derived from rawToken[:12] for UI display ("htop_abcd…"). The raw
// value exists exactly once — in the API response of POST
// /v1/tokens — and never appears again.

import { createHash, randomBytes } from 'node:crypto';
import { db } from '@hiring-os/db';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz234567'; // RFC 4648 base32 (lower)

function randomBase32(chars: number): string {
  const bytes = randomBytes(chars);
  let out = '';
  for (let i = 0; i < chars; i++) {
    out += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return out;
}

export function generateRawToken(): string {
  return `htop_${randomBase32(24)}`;
}

export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export type IssueArgs = {
  organizationId: string;
  createdById: string;
  name: string;
  scopes: string[];
  expiresAt?: Date | null;
};

export type IssueResult = {
  tokenId: string;
  // ONLY returned on issuance — never persisted.
  rawToken: string;
  prefix: string;
};

export async function issueToken(args: IssueArgs): Promise<IssueResult> {
  const raw = generateRawToken();
  const tokenHash = hashToken(raw);
  const prefix = raw.slice(0, 12); // "htop_abcdefg"

  const token = await db.apiToken.create({
    data: {
      organizationId: args.organizationId,
      createdById: args.createdById,
      name: args.name,
      scopes: args.scopes,
      tokenHash,
      prefix,
      expiresAt: args.expiresAt ?? null,
    },
    select: { id: true },
  });

  return { tokenId: token.id, rawToken: raw, prefix };
}

export type VerifiedToken = {
  tokenId: string;
  organizationId: string;
  scopes: string[];
};

export async function verifyToken(
  raw: string
): Promise<VerifiedToken | null> {
  if (!raw.startsWith('htop_')) return null;
  const tokenHash = hashToken(raw);
  const row = await db.apiToken.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      organizationId: true,
      scopes: true,
      revokedAt: true,
      expiresAt: true,
    },
  });
  if (!row) return null;
  if (row.revokedAt) return null;
  if (row.expiresAt && row.expiresAt.getTime() < Date.now()) return null;
  return {
    tokenId: row.id,
    organizationId: row.organizationId,
    scopes: row.scopes,
  };
}

export async function touchTokenLastUsed(
  tokenId: string,
  ip: string | null
): Promise<void> {
  await db.apiToken
    .update({
      where: { id: tokenId },
      data: { lastUsedAt: new Date(), lastUsedIp: ip },
    })
    .catch(() => {});
}

export async function revokeToken(tokenId: string): Promise<void> {
  await db.apiToken.update({
    where: { id: tokenId },
    data: { revokedAt: new Date() },
  });
}
