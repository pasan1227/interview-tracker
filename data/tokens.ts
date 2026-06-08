import {
  INVITATION_TOKEN_TTL_MS,
  PASSWORD_RESET_TOKEN_TTL_MS,
  TWO_FACTOR_TOKEN_TTL_MS,
  VERIFICATION_TOKEN_TTL_MS,
} from '@/lib/auth-constants';
import { db } from '@/lib/db';
import { OrganizationRole } from '@/lib/generated/prisma/enums';
import crypto from 'crypto';
import { v4 as uuid } from 'uuid';

// Verification and password-reset tokens are persisted as sha256 hashes
// rather than the raw UUIDs they're shipped as. A DB-read leak no longer
// hands an attacker a working reset/verification link — they'd need to
// reverse the hash, which is infeasible for 128-bit UUID inputs.
//
// 2FA tokens stay plaintext because they're 6-digit numerics: hashing a
// 1-million-element search space is no defense (a leaked hash is
// trivially brute-forced offline), and the timing-safe comparison path
// at the call site needs the original value anyway.
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Generator return type — exposes the *raw* token (only the email
// pipeline ever sees this) plus the public bookkeeping fields. The DB
// row stores hashToken(token).
type GeneratedToken = {
  email: string;
  token: string;
  expires: Date;
};

// ---------- Generators ----------

export const generateVerificationToken = async (
  email: string
): Promise<GeneratedToken> => {
  const rawToken = uuid();
  const expires = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);

  const existing = await getVerificationTokenByEmail(email);
  if (existing) {
    await db.verificationToken.delete({ where: { id: existing.id } });
  }
  await db.verificationToken.create({
    data: { email, token: hashToken(rawToken), expires },
  });
  return { email, token: rawToken, expires };
};

export const generatePasswordResetToken = async (
  email: string
): Promise<GeneratedToken> => {
  const rawToken = uuid();
  const expires = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS);

  const existing = await getPasswordResetTokenByEmail(email);
  if (existing) {
    await db.passwordResetToken.delete({ where: { id: existing.id } });
  }
  await db.passwordResetToken.create({
    data: { email, token: hashToken(rawToken), expires },
  });
  return { email, token: rawToken, expires };
};

export const generateTwoFactorToken = async (email: string) => {
  // See note above — 2FA tokens stay plaintext.
  const token = crypto.randomInt(100_000, 1_000_000).toString();
  const expires = new Date(Date.now() + TWO_FACTOR_TOKEN_TTL_MS);

  const existing = await getTwoFactorTokenByEmail(email);
  if (existing) {
    await db.twoFactorToken.delete({ where: { id: existing.id } });
  }
  return db.twoFactorToken.create({ data: { email, token, expires } });
};

// ---------- Lookups ----------
// By-email lookups are used internally to clean up an existing row
// before issuing a new one. They return the stored (hashed) value, but
// no caller reads the token field — they only use id for the delete.
//
// By-token lookups accept the RAW token from the URL and hash it
// before findUnique, since that's what's in the column.

// Internal only — used by generateVerificationToken to clear the
// existing row before issuing a new one.
const getVerificationTokenByEmail = (email: string) =>
  safeFirst(() => db.verificationToken.findFirst({ where: { email } }));

export const getVerificationTokenByToken = (rawToken: string) =>
  safeFirst(() =>
    db.verificationToken.findUnique({ where: { token: hashToken(rawToken) } })
  );

// Internal only — used by generatePasswordResetToken to clear the
// existing row before issuing a new one.
const getPasswordResetTokenByEmail = (email: string) =>
  safeFirst(() => db.passwordResetToken.findFirst({ where: { email } }));

export const getPasswordResetTokenByToken = (rawToken: string) =>
  safeFirst(() =>
    db.passwordResetToken.findUnique({ where: { token: hashToken(rawToken) } })
  );

export const getTwoFactorTokenByEmail = (email: string) =>
  safeFirst(() => db.twoFactorToken.findFirst({ where: { email } }));

// ---------- Invitations ----------
// Same hash-the-token pattern as verification + password-reset: the
// raw token lives only in the email body, the DB stores the digest.

export type GeneratedInvitation = {
  email: string;
  organizationId: string;
  token: string; // raw, only ever returned to the email sender
  expires: Date;
};

export const generateInvitationToken = async ({
  organizationId,
  email,
  role,
  invitedById,
}: {
  organizationId: string;
  email: string;
  role: OrganizationRole;
  invitedById: string;
}): Promise<GeneratedInvitation> => {
  const rawToken = uuid();
  const expires = new Date(Date.now() + INVITATION_TOKEN_TTL_MS);

  // Replace any prior unaccepted invite for this (org, email) so the
  // most recent link is always the only valid one. Already-accepted
  // rows stay for audit history.
  await db.invitation.deleteMany({
    where: { organizationId, email, acceptedAt: null },
  });
  await db.invitation.create({
    data: {
      organizationId,
      email,
      role,
      invitedById,
      token: hashToken(rawToken),
      expires,
    },
  });
  return { email, organizationId, token: rawToken, expires };
};

// Raw token in → row out. Returns null on miss / expired so the
// caller never branches on hashed-vs-raw inputs.
export const getInvitationByToken = (rawToken: string) =>
  safeFirst(() =>
    db.invitation.findUnique({
      where: { token: hashToken(rawToken) },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
        invitedBy: { select: { id: true, name: true, email: true } },
      },
    })
  );

async function safeFirst<T>(fn: () => Promise<T | null>): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    console.error('Token lookup failed:', error);
    return null;
  }
}
