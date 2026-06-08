'use server';

import { generateInvitationToken } from '@/data/tokens';
import { db } from '@/lib/db';
import { AuthzError, requireOrgAdmin, toOrgContext } from '@/lib/authz';
import { OrganizationRole, MembershipStatus } from '@/lib/generated/prisma/enums';
import { sendInvitationEmail } from '@/lib/mail';
import { rateLimit } from '@/lib/rate-limit';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const InviteSchema = z.object({
  email: z.string().email().transform((e) => e.trim().toLowerCase()),
  role: z.nativeEnum(OrganizationRole),
});

export type InviteMemberInput = z.infer<typeof InviteSchema>;

// Per-org invite cap so a noisy admin can't burn the org's Resend
// reputation or DOS the recipient. 50/day per org is generous; bump
// later if real customers hit it.
const INVITE_LIMIT_PER_DAY = 50;

export async function inviteMember(input: InviteMemberInput) {
  const user = await requireOrgAdmin();
  const ctx = toOrgContext(user);

  const parsed = InviteSchema.safeParse(input);
  if (!parsed.success) throw new AuthzError('Invalid input');
  const { email, role } = parsed.data;

  // OWNER role is reserved for the existing owner — admins can't
  // create a new OWNER through invitations. Use the
  // transferOwnership action (future) for that.
  if (role === OrganizationRole.OWNER) {
    throw new AuthzError('Cannot invite as OWNER');
  }

  const gate = await rateLimit(`invite:org:${ctx.organizationId}`, {
    limit: INVITE_LIMIT_PER_DAY,
    windowMs: 24 * 60 * 60 * 1000,
  });
  if (!gate.ok) {
    throw new AuthzError('Daily invitation limit reached');
  }

  // Don't bother emailing someone who is already an ACTIVE member.
  const existingMember = await db.membership.findFirst({
    where: {
      organizationId: ctx.organizationId,
      status: MembershipStatus.ACTIVE,
      user: { email },
    },
    select: { id: true },
  });
  if (existingMember) {
    throw new AuthzError('User is already a member of this organization');
  }

  // Fetch org name for the email subject + body.
  const org = await db.organization.findUniqueOrThrow({
    where: { id: ctx.organizationId },
    select: { name: true },
  });

  const { token } = await generateInvitationToken({
    organizationId: ctx.organizationId,
    email,
    role,
    invitedById: user.id,
  });

  await sendInvitationEmail({
    email,
    token,
    orgName: org.name,
    inviterName: user.name ?? user.email,
    role,
  });

  revalidatePath('/settings/members');
  return { email };
}
