'use server';

import { generateVerificationToken } from '@/data/tokens';
import { getUserByEmail } from '@/data/user';
import { BCRYPT_COST } from '@/lib/auth-constants';
import { db } from '@/lib/db';
import { sendVerificationEmail } from '@/lib/mail';
import { rateLimit } from '@/lib/rate-limit';
import { RegisterSchema } from '@/lib/validations/auth';
import bcrypt from 'bcryptjs';
import { headers } from 'next/headers';
import * as z from 'zod';

const GENERIC_SUCCESS =
  'If that email is available, we sent a confirmation link.';

export const register = async (values: z.infer<typeof RegisterSchema>) => {
  const validated = RegisterSchema.safeParse(values);
  if (!validated.success) return { error: 'Invalid fields!' };

  const { email, name, password } = validated.data;

  const ip = await clientIp();
  const ipLimit = await rateLimit(`register:ip:${ip}`, { limit: 10, windowMs: 60_000 });
  if (!ipLimit.ok) {
    return { error: 'Too many attempts. Please try again in a moment.' };
  }

  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    // Return the same success message to avoid email enumeration.
    return { success: GENERIC_SUCCESS };
  }

  const hashedPassword = await bcrypt.hash(password, BCRYPT_COST);

  await db.user.create({ data: { name, email, password: hashedPassword } });

  const verificationToken = await generateVerificationToken(email);
  await sendVerificationEmail(verificationToken.email, verificationToken.token);

  return { success: GENERIC_SUCCESS };
};

async function clientIp() {
  const h = await headers();
  return (
    h.get('x-forwarded-for')?.split(',')[0].trim() ||
    h.get('x-real-ip') ||
    'unknown'
  );
}
