'use server';

//
import { AuthzError, requireOrgAdmin, toOrgContext } from '@/lib/authz';
import { MembershipStatus, OrganizationRole } from '@/lib/generated/prisma/enums';
import { tenantDb } from '@/lib/tenant-db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const MembershipIdSchema = z.string().cuid();

// Remove a member from the org. OWNER can't be revoked through this
// action — owner transfer is a separate flow (defer to v1.1).
export async function revokeMembership(membershipId: string) {
  const user = await requireOrgAdmin();
  const ctx = toOrgContext(user);
  const parsed = MembershipIdSchema.safeParse(membershipId);
  if (!parsed.success) throw new AuthzError('Invalid membership id');

  const db = tenantDb(ctx);
  const membership = await db.membership.findUnique({
    where: { id: parsed.data },
    select: { id: true, role: true, userId: true },
  });
  if (!membership) throw new AuthzError('Membership not found');
  if (membership.role === OrganizationRole.OWNER) {
    throw new AuthzError('Cannot revoke the OWNER role here');
  }
  if (membership.userId === user.id) {
    throw new AuthzError('Use a different admin to revoke yourself');
  }

  await db.membership.update({
    where: { id: parsed.data },
    data: { status: MembershipStatus.SUSPENDED },
  });

  revalidatePath('/dashboard/settings/members');
  return true;
}
