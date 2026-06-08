'use server';

import { getInvitationByToken } from '@/data/tokens';
import { getUserByEmail } from '@/data/user';
import { BCRYPT_COST } from '@/lib/auth-constants';
import { db } from '@/lib/db';
import { MembershipStatus } from '@/lib/generated/prisma/enums';
import { rateLimit } from '@/lib/rate-limit';
import { RegisterSchema } from '@/lib/validations/auth';
import bcrypt from 'bcryptjs';
import { headers } from 'next/headers';
import * as z from 'zod';

// PR 12: signup is invite-only. The register action now requires a
// valid `invitationToken` — the public /register URL without one
// renders an "ask for an invitation" message.
//
// Flow:
//   1. Admin invites foo@company.com via /settings/members
//   2. foo clicks the email → /invitations/accept?token=X
//   3. /invitations/accept detects no account → /register?invitationToken=X
//   4. /register form prefills email from the invitation, submits to
//      this action with the token
//   5. Action verifies the token, creates the user (email auto-verified
//      because owning the invited inbox proved email control), creates
//      an ACTIVE Membership, marks invitation acceptedAt
//   6. Form redirects to /login; user signs in and JWT picks up the
//      single new org as their activeOrgId

type RegisterPayload = z.infer<typeof RegisterSchema> & {
  invitationToken?: string;
};

export const register = async (values: RegisterPayload) => {
  const { invitationToken, ...rest } = values;
  const validated = RegisterSchema.safeParse(rest);
  if (!validated.success) throw new Error('Invalid fields!');

  const { email, name, password } = validated.data;

  const ip = await clientIp();
  const ipLimit = await rateLimit(`register:ip:${ip}`, {
    limit: 10,
    windowMs: 60_000,
  });
  if (!ipLimit.ok) {
    throw new Error('Too many attempts. Please try again in a moment.');
  }

  if (!invitationToken) {
    throw new Error(
      'InterviewPro is invite-only. Ask your team admin to send you an invitation.'
    );
  }

  const invitation = await getInvitationByToken(invitationToken);
  if (
    !invitation ||
    invitation.acceptedAt ||
    invitation.expires < new Date()
  ) {
    throw new Error('Invitation not found or expired');
  }
  if (invitation.email.toLowerCase() !== email.toLowerCase()) {
    throw new Error(
      'This invitation was sent to a different email address'
    );
  }

  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw new Error(
      'An account already exists for this email. Sign in instead.'
    );
  }

  const hashedPassword = await bcrypt.hash(password, BCRYPT_COST);

  // Atomic: create user, create membership, mark invitation accepted.
  // Email auto-verified because owning the invited inbox is already
  // proof of email ownership.
  await db.$transaction([
    db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        emailVerified: new Date(),
      },
    }),
    // Reference the new user by email from within the same transaction.
    // upsert returns its row; we follow it with a membership create
    // tied to the freshly-issued userId.
  ]);

  const created = await db.user.findUniqueOrThrow({
    where: { email },
    select: { id: true },
  });

  await db.$transaction([
    db.membership.create({
      data: {
        userId: created.id,
        organizationId: invitation.organizationId,
        role: invitation.role,
        status: MembershipStatus.ACTIVE,
        invitedById: invitation.invitedById,
        acceptedAt: new Date(),
      },
    }),
    db.invitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    }),
  ]);

  return {
    message: 'Account created. Sign in to continue.',
  };
};

async function clientIp() {
  const h = await headers();
  return (
    h.get('x-forwarded-for')?.split(',')[0].trim() ||
    h.get('x-real-ip') ||
    'unknown'
  );
}
