'use server';

import { getUserByEmail } from '@/data/user';
import { getVerificationTokenByToken } from '@/data/verification-token';
import { db } from '@/lib/db';

export const newVerification = async (token: string) => {
  try {
    if (!token) {
      return { error: 'Missing token!' };
    }

    const existingToken = await getVerificationTokenByToken(token);

    if (!existingToken) {
      return { error: 'Invalid or expired token!' };
    }

    const hasExpired = new Date(existingToken.expires) < new Date();

    if (hasExpired) {
      // Clean up expired token
      await db.verificationToken.delete({
        where: { id: existingToken.id },
      }).catch(() => {
        // Token might already be deleted, ignore error
      });
      return { error: 'Token has expired! Please request a new verification email.' };
    }

    const existingUser = await getUserByEmail(existingToken.email);

    if (!existingUser) {
      return { error: 'User not found!' };
    }

    // Check if already verified
    if (existingUser.emailVerified) {
      // Clean up token since user is already verified
      await db.verificationToken.delete({
        where: { id: existingToken.id },
      }).catch(() => {
        // Token might already be deleted, ignore error
      });
      return { success: 'Email is already verified! You can now log in.' };
    }

    // Perform verification in a transaction
    await db.$transaction(async (tx) => {
      // Update user verification status
      await tx.user.update({
        where: { id: existingUser.id },
        data: {
          emailVerified: new Date(),
          email: existingToken.email, // Ensure email consistency
        },
      });

      // Delete the verification token
      await tx.verificationToken.delete({
        where: { id: existingToken.id },
      });
    });

    return { success: 'Email verified successfully! You can now log in.' };
  } catch (error) {
    console.error('Verification error:', error);
    return { error: 'Something went wrong during verification!' };
  }
};
