'use server';

import { generatePasswordResetToken } from '@/data/tokens';
import { getUserByEmail } from '@/data/user';
import { sendPasswordResetEmail } from '@/lib/mail';
import { rateLimit } from '@/lib/rate-limit';
import { ResetSchema } from '@/lib/validations/auth';
import { headers } from 'next/headers';
import * as z from 'zod';

const GENERIC_SUCCESS =
  'If that email is registered, we sent a password reset link.';

export const reset = async (values: z.infer<typeof ResetSchema>) => {
  const validated = ResetSchema.safeParse(values);
  if (!validated.success) return { error: 'Invalid email!' };

  const { email } = validated.data;

  const ip = await clientIp();
  const ipLimit = await rateLimit(`reset:ip:${ip}`, { limit: 5, windowMs: 60_000 });
  if (!ipLimit.ok) {
    return { error: 'Too many attempts. Please try again in a moment.' };
  }
  const emailLimit = await rateLimit(`reset:email:${email}`, {
    limit: 3,
    windowMs: 10 * 60_000,
  });
  if (!emailLimit.ok) {
    return { success: GENERIC_SUCCESS };
  }

  const user = await getUserByEmail(email);
  if (!user?.password) return { success: GENERIC_SUCCESS };

  const token = await generatePasswordResetToken(email);
  await sendPasswordResetEmail(token.email, token.token);

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
