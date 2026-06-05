'use server';
import { signIn } from '@/auth';
import { generateTwoFactorToken, generateVerificationToken } from '@/data/tokens';
import { getTwoFactorTokenByEmail } from '@/data/tokens';
import { getUserByEmail } from '@/data/user';
import { db } from '@/lib/db';
import { sendTwoFactorTokenEmail, sendVerificationEmail } from '@/lib/mail';
import { rateLimit } from '@/lib/rate-limit';
import { LoginSchema } from '@/lib/validations/auth';
import { DEFAULT_LOGIN_REDIRECT } from '@/routes';
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
  const ipLimit = rateLimit(`login:ip:${ip}`, { limit: 20, windowMs: 60_000 });
  const emailLimit = rateLimit(`login:email:${email}`, { limit: 5, windowMs: 60_000 });
  if (!ipLimit.ok || !emailLimit.ok) {
    return { error: 'Too many attempts. Please try again in a moment.' };
  }

  const existingUser = await getUserByEmail(email);
  // Same error for "no user", "no password (OAuth)", and "wrong password" — no enumeration.
  if (!existingUser?.email || !existingUser.password) {
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
      redirectTo: callbackUrl || DEFAULT_LOGIN_REDIRECT,
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
