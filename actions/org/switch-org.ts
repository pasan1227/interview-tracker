'use server';

import { unstable_update } from '@/auth';
import { getMembership } from '@/data/membership';
import { AuthzError, requireSession } from '@/lib/authz';
import { MembershipStatus } from '@/lib/generated/prisma/enums';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const OrgIdSchema = z.string().cuid();

// Server action that flips the JWT's active organization. The JWT
// callback in auth.ts re-validates the membership server-side, so
// passing an org the user isn't in is a no-op — but we also reject
// it here so the action returns a useful error instead of silently
// "succeeding" with the old activeOrgId.
export async function switchActiveOrg(orgId: string) {
  const user = await requireSession();
  const parsed = OrgIdSchema.safeParse(orgId);
  if (!parsed.success) throw new AuthzError('Invalid organization id');

  const membership = await getMembership(user.id, parsed.data);
  if (
    !membership ||
    membership.status !== MembershipStatus.ACTIVE ||
    membership.organization.deletedAt
  ) {
    throw new AuthzError('Forbidden');
  }

  await unstable_update({
    // The JWT callback only reads activeOrgId from the update payload
    // — slug/role are re-derived from the verified membership row.
    user: { activeOrgId: parsed.data },
  });

  // The dashboard caches some data per request; revalidate the root
  // so the next render hits a clean slate.
  revalidatePath('/dashboard');
  redirect('/dashboard');
}
