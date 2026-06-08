import { OrganizationRole } from '@/lib/generated/prisma/enums';
import { tenantDb, type OrgContext } from '@/lib/tenant-db';

// Rows shown on /settings/members. Memberships + invitations
// in one shape so the page can render both lists side by side.

export async function getOrgMembers(ctx: OrgContext) {
  const db = tenantDb(ctx);
  const memberships = await db.membership.findMany({
    select: {
      id: true,
      role: true,
      status: true,
      acceptedAt: true,
      createdAt: true,
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
    orderBy: [
      // Owners + admins first, then everyone else alphabetical by name.
      { role: 'asc' },
      { user: { name: 'asc' } },
    ],
  });
  return memberships;
}

export async function getOrgInvitations(ctx: OrgContext) {
  const db = tenantDb(ctx);
  const invitations = await db.invitation.findMany({
    where: { acceptedAt: null },
    select: {
      id: true,
      email: true,
      role: true,
      expires: true,
      invitedBy: { select: { name: true, email: true } },
    },
    orderBy: { expires: 'desc' },
  });
  return invitations;
}

// True if the role can mutate this org. Manager+ but not OWNER (owner
// is an org-level operation, not a per-action gate).
export function isOrgManagerRole(role: OrganizationRole): boolean {
  return (
    role === OrganizationRole.OWNER ||
    role === OrganizationRole.ADMIN ||
    role === OrganizationRole.MANAGER
  );
}
