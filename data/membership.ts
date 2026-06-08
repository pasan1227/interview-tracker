import { db } from '@/lib/db';
import { MembershipStatus, OrganizationRole } from '@/lib/generated/prisma/enums';

export type UserOrgMembership = {
  id: string;
  slug: string;
  name: string;
  role: OrganizationRole;
};

// Memberships the user can switch into right now: ACTIVE on a
// non-deleted org. SUSPENDED rows are deliberately omitted — they're
// effectively a soft kick from the org and shouldn't appear in the
// switcher.
export async function getActiveMembershipsForUser(
  userId: string
): Promise<UserOrgMembership[]> {
  const rows = await db.membership.findMany({
    where: {
      userId,
      status: MembershipStatus.ACTIVE,
      organization: { deletedAt: null },
    },
    select: {
      role: true,
      organization: { select: { id: true, slug: true, name: true } },
    },
    orderBy: { organization: { name: 'asc' } },
  });
  return rows.map((r) => ({
    id: r.organization.id,
    slug: r.organization.slug,
    name: r.organization.name,
    role: r.role,
  }));
}

// Verify a user is an ACTIVE member of the given org. Used by the
// JWT callback to reject "switch to org I'm not in" attempts.
export async function getMembership(userId: string, organizationId: string) {
  return db.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
    select: {
      role: true,
      status: true,
      organization: { select: { slug: true, deletedAt: true } },
    },
  });
}
