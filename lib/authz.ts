import { OrganizationRole, MembershipStatus } from '@/lib/generated/prisma/enums';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import type { OrgContext } from '@/lib/tenant-db-helpers';
import { redirect } from 'next/navigation';

// PR 13: legacy SessionUser / requireRole / requirePageRole /
// requireAdmin / requireManagerOrAdmin / isAdmin / isManagerOrAdmin
// helpers are gone. Authorization is now per-org via requireOrgRole
// (action) and requirePageOrgRole (page). The pre-org primitives —
// requireSession + requirePageSession — stay because /no-access,
// /select-org, /invitations/accept, and the profile page all run
// before an active org exists.

// Pre-org session shape — used by callers that don't yet know which
// org the user is in (signup, invite accept, profile, org chooser).
export type PreOrgUser = {
  id: string;
  email: string;
  name?: string | null;
};

// Authenticated user + active organization context. Returned by
// requireOrgSession / requireOrgRole. The role here is the user's
// role WITHIN the active org (from Membership).
export type ActiveOrgUser = {
  id: string;
  organizationId: string;
  organizationSlug: string;
  role: OrganizationRole;
  email: string;
  name?: string | null;
  isPlatformAdmin: boolean;
};

export class AuthzError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'AuthzError';
  }
}

// ---------- Pre-org helpers ----------
// Use these for routes that can't yet require an active org (signup,
// org chooser, invitation accept, profile).

export async function requireSession(): Promise<PreOrgUser> {
  const session = await getSession();
  if (!session?.user?.id) throw new AuthzError('Unauthorized');
  return {
    id: session.user.id,
    email: session.user.email!,
    name: session.user.name,
  };
}

export async function requirePageSession(): Promise<PreOrgUser> {
  const session = await getSession();
  if (!session?.user?.id) redirect('/login');
  return {
    id: session.user.id,
    email: session.user.email!,
    name: session.user.name,
  };
}

// ---------- Org-scoped helpers ----------

export async function requireOrgSession(): Promise<ActiveOrgUser> {
  const session = await getSession();
  if (!session?.user?.id) throw new AuthzError('Unauthorized');

  const activeOrgId = session.user.activeOrgId;
  if (!activeOrgId) throw new AuthzError('No active organization');

  // Defense in depth: re-verify membership server-side rather than
  // trusting the JWT. Race: an admin suspends a member between page
  // loads — next request is rejected.
  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: session.user.id,
        organizationId: activeOrgId,
      },
    },
    select: {
      role: true,
      status: true,
      organization: { select: { slug: true, deletedAt: true } },
    },
  });
  if (
    !membership ||
    membership.status !== MembershipStatus.ACTIVE ||
    membership.organization.deletedAt
  ) {
    throw new AuthzError('Forbidden');
  }

  return {
    id: session.user.id,
    organizationId: activeOrgId,
    organizationSlug: membership.organization.slug,
    role: membership.role,
    email: session.user.email!,
    name: session.user.name,
    isPlatformAdmin: session.user.isPlatformAdmin ?? false,
  };
}

export async function requireOrgRole(
  roles: readonly OrganizationRole[]
): Promise<ActiveOrgUser> {
  const user = await requireOrgSession();
  if (!roles.includes(user.role)) throw new AuthzError('Forbidden');
  return user;
}

export const requireOrgOwner = () => requireOrgRole([OrganizationRole.OWNER]);
export const requireOrgAdmin = () =>
  requireOrgRole([OrganizationRole.OWNER, OrganizationRole.ADMIN]);
export const requireOrgManagerOrAdmin = () =>
  requireOrgRole([
    OrganizationRole.OWNER,
    OrganizationRole.ADMIN,
    OrganizationRole.MANAGER,
  ]);

// Page variants (redirect instead of throw).
export async function requirePageOrgSession(): Promise<ActiveOrgUser> {
  try {
    return await requireOrgSession();
  } catch (e) {
    if (e instanceof AuthzError && e.message === 'No active organization') {
      redirect('/select-org');
    }
    redirect('/login');
  }
}

export async function requirePageOrgRole(
  roles: OrganizationRole | readonly OrganizationRole[]
): Promise<ActiveOrgUser> {
  const user = await requirePageOrgSession();
  const allow = Array.isArray(roles) ? roles : [roles];
  if (!allow.includes(user.role)) redirect('/dashboard');
  return user;
}

// Convert an ActiveOrgUser into the OrgContext shape tenantDb() needs.
export function toOrgContext(u: ActiveOrgUser): OrgContext {
  return {
    organizationId: u.organizationId,
    userId: u.id,
    role: u.role,
  };
}

// Org-scoped predicates.
export const isOrgOwner = (u: ActiveOrgUser) => u.role === OrganizationRole.OWNER;
export const isOrgAdmin = (u: ActiveOrgUser) =>
  u.role === OrganizationRole.OWNER || u.role === OrganizationRole.ADMIN;
export const isOrgManagerOrAdmin = (u: ActiveOrgUser) =>
  u.role === OrganizationRole.OWNER ||
  u.role === OrganizationRole.ADMIN ||
  u.role === OrganizationRole.MANAGER;
