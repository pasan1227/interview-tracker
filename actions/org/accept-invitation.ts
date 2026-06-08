'use server';

import { unstable_update } from '@/auth';
import { getInvitationByToken } from '@/data/tokens';
import { db } from '@/lib/db';
import { AuthzError, requireSession } from '@/lib/authz';
import { MembershipStatus } from '@/lib/generated/prisma/enums';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const TokenSchema = z.string().min(1);

// Accept an invitation. The user must already be signed in with the
// invited email; if their session email differs, we fail closed so a
// shared link can't be claimed by the wrong account.
export async function acceptInvitation(rawToken: string) {
  const tokenParse = TokenSchema.safeParse(rawToken);
  if (!tokenParse.success) throw new AuthzError('Invalid invitation token');

  const user = await requireSession();
  const invitation = await getInvitationByToken(tokenParse.data);

  if (!invitation) throw new AuthzError('Invitation not found');
  if (invitation.acceptedAt) throw new AuthzError('Invitation already used');
  if (invitation.expires < new Date()) {
    throw new AuthzError('Invitation expired');
  }
  if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
    throw new AuthzError(
      'This invitation was sent to a different email address'
    );
  }

  // Idempotent membership upsert. If the user already has a row
  // (e.g. they were SUSPENDED and re-invited), flip them ACTIVE.
  await db.$transaction([
    db.membership.upsert({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: invitation.organizationId,
        },
      },
      create: {
        userId: user.id,
        organizationId: invitation.organizationId,
        role: invitation.role,
        status: MembershipStatus.ACTIVE,
        invitedById: invitation.invitedById,
        invitedAt: invitation.expires, // approximate; we don't store invitedAt on Invitation
        acceptedAt: new Date(),
      },
      update: {
        role: invitation.role,
        status: MembershipStatus.ACTIVE,
        acceptedAt: new Date(),
      },
    }),
    db.invitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    }),
  ]);

  // Switch the JWT to the org they just joined. The jwt() callback
  // re-validates the membership before accepting.
  await unstable_update({
    user: { activeOrgId: invitation.organizationId },
  });

  redirect('/dashboard');
}
