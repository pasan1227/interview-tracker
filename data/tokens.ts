import {
  PASSWORD_RESET_TOKEN_TTL_MS,
  TWO_FACTOR_TOKEN_TTL_MS,
  VERIFICATION_TOKEN_TTL_MS,
} from '@/lib/auth-constants';
import { db } from '@/lib/db';
import crypto from 'crypto';
import { v4 as uuid } from 'uuid';

// ---------- Generators ----------

export const generateVerificationToken = async (email: string) => {
  const token = uuid();
  const expires = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);

  const existing = await getVerificationTokenByEmail(email);
  if (existing) {
    await db.verificationToken.delete({ where: { id: existing.id } });
  }
  return db.verificationToken.create({ data: { email, token, expires } });
};

export const generatePasswordResetToken = async (email: string) => {
  const token = uuid();
  const expires = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS);

  const existing = await getPasswordResetTokenByEmail(email);
  if (existing) {
    await db.passwordResetToken.delete({ where: { id: existing.id } });
  }
  return db.passwordResetToken.create({ data: { email, token, expires } });
};

export const generateTwoFactorToken = async (email: string) => {
  const token = crypto.randomInt(100_000, 1_000_000).toString();
  const expires = new Date(Date.now() + TWO_FACTOR_TOKEN_TTL_MS);

  const existing = await getTwoFactorTokenByEmail(email);
  if (existing) {
    await db.twoFactorToken.delete({ where: { id: existing.id } });
  }
  return db.twoFactorToken.create({ data: { email, token, expires } });
};

// ---------- Lookups ----------

export const getVerificationTokenByEmail = (email: string) =>
  safeFirst(() => db.verificationToken.findFirst({ where: { email } }));

export const getVerificationTokenByToken = (token: string) =>
  safeFirst(() => db.verificationToken.findUnique({ where: { token } }));

export const getPasswordResetTokenByEmail = (email: string) =>
  safeFirst(() => db.passwordResetToken.findFirst({ where: { email } }));

export const getPasswordResetTokenByToken = (token: string) =>
  safeFirst(() => db.passwordResetToken.findUnique({ where: { token } }));

export const getTwoFactorTokenByEmail = (email: string) =>
  safeFirst(() => db.twoFactorToken.findFirst({ where: { email } }));

export const getTwoFactorTokenByToken = (token: string) =>
  safeFirst(() => db.twoFactorToken.findUnique({ where: { token } }));

async function safeFirst<T>(fn: () => Promise<T | null>): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    console.error('Token lookup failed:', error);
    return null;
  }
}
