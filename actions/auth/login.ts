'use server';
import { signIn } from '@/auth';
import { generateTwoFactorToken, generateVerificationToken } from '@/data/tokens';
import { getTwoFactorTokenByEmail } from '@/data/tokens';
import { getUserByEmail } from '@/data/user';
import { db } from '@/lib/db';
import { sendTwoFactorTokenEmail, sendVerificationEmail } from '@/lib/mail';
import { rateLimit } from '@/lib/rate-limit';
import { LoginSchema } from '@/lib/validations/auth';
import { safeCallbackUrl } from '@/routes';
import bcrypt from 'bcryptjs';
import { timingSafeEqual } from 'crypto';
import { AuthError } from 'next-auth';
import { headers } from 'next/headers';
import * as z from 'zod';

const GENERIC_INVALID = 'Invalid credentials.';

export const login = async (
  values: z.infer<typeof LoginSchema>,
  callbackUrl?: string | null
) => {
  const validated = LoginSchema.safeParse(values);
  if (!validated.success) return { error: 'Invalid fields!' };

  const { email, password, code } = validated.data;

  const ip = await clientIp();
  const [ipLimit, emailLimit] = await Promise.all([
    rateLimit(`login:ip:${ip}`, { limit: 20, windowMs: 60_000 }),
    rateLimit(`login:email:${email}`, { limit: 5, windowMs: 60_000 }),
  ]);
  if (!ipLimit.ok || !emailLimit.ok) {
    return { error: 'Too many attempts. Please try again in a moment.' };
  }

  const existingUser = await getUserByEmail(email);
  // Same error for "no user", "no password (OAuth)", and "wrong password"
  // — no enumeration.
  if (!existingUser?.email || !existingUser.password) {
    return { error: GENERIC_INVALID };
  }

  // Verify the password BEFORE branching on emailVerified. Otherwise the
  // {verifyEmail} response + automatic verification-email resend acts
  // as a registered-account oracle, and lets anyone with a candidate
  // email burn through the per-email rate limit on the verification
  // sender. signIn() below does its own bcrypt.compare via the
  // credentials provider, so this is one extra hash on the unhappy path.
  const passwordMatch = await bcrypt.compare(password, existingUser.password);
  if (!passwordMatch) {
    return { error: GENERIC_INVALID };
  }

  if (!existingUser.emailVerified) {
    const verificationToken = await generateVerificationToken(existingUser.email);
    await sendVerificationEmail(verificationToken.email, verificationToken.token);
    return {
      verifyEmail:
        'Please verify your email. We sent a new confirmation link to your inbox.',
    };
  }

  if (existingUser.isTwoFactorEnabled) {
    if (code) {
      const twoFactorToken = await getTwoFactorTokenByEmail(existingUser.email);
      if (!twoFactorToken || !codeMatches(twoFactorToken.token, code)) {
        return { error: 'Invalid code!' };
      }
      if (new Date(twoFactorToken.expires) < new Date()) {
        return { error: 'Code expired!' };
      }
      await db.twoFactorToken.delete({ where: { id: twoFactorToken.id } });
      await db.twoFactorConfirmation.upsert({
        where: { userId: existingUser.id },
        update: {},
        create: { userId: existingUser.id },
      });
    } else {
      const twoFactorToken = await generateTwoFactorToken(existingUser.email);
      await sendTwoFactorTokenEmail(twoFactorToken.email, twoFactorToken.token);
      return { twoFactor: true };
    }
  }

  try {
    await signIn('credentials', {
      email,
      password,
      redirectTo: safeCallbackUrl(callbackUrl),
    });
    return { error: 'Something went wrong!' };
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'digest' in error &&
      String(error.digest).includes('NEXT_REDIRECT')
    ) {
      throw error;
    }
    if (error instanceof AuthError) {
      return { error: GENERIC_INVALID };
    }
    throw error;
  }
};

function codeMatches(a: string, b: string) {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

async function clientIp() {
  const h = await headers();
  return (
    h.get('x-forwarded-for')?.split(',')[0].trim() ||
    h.get('x-real-ip') ||
    'unknown'
  );
}
