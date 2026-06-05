'use server';

import { getPasswordResetTokenByToken } from '@/data/tokens';
import { getUserByEmail } from '@/data/user';
import { BCRYPT_COST } from '@/lib/auth-constants';
import { db } from '@/lib/db';
import { NewPasswordSchema } from '@/lib/validations/auth';
import bcrypt from 'bcryptjs';
import * as z from 'zod';

export const newPassword = async (
  values: z.infer<typeof NewPasswordSchema>,
  token?: string | null
) => {
  if (!token) return { error: 'Missing token!' };

  const validated = NewPasswordSchema.safeParse(values);
  if (!validated.success) return { error: 'Invalid password!' };

  const existingToken = await getPasswordResetTokenByToken(token);
  if (!existingToken) return { error: 'Invalid token!' };

  if (new Date(existingToken.expires) < new Date()) {
    await db.passwordResetToken
      .delete({ where: { id: existingToken.id } })
      .catch(() => {});
    return { error: 'Token has expired!' };
  }

  const existingUser = await getUserByEmail(existingToken.email);
  if (!existingUser) return { error: 'Invalid token!' };

  const hashedPassword = await bcrypt.hash(validated.data.password, BCRYPT_COST);

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: existingUser.id },
      data: { password: hashedPassword },
    });
    await tx.passwordResetToken.delete({ where: { id: existingToken.id } });
  });

  return { success: 'Password updated. You can now sign in.' };
};
