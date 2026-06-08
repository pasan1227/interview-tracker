import { UserRole } from '@/lib/generated/prisma/browser';
import { OrganizationRole, MembershipStatus } from '@/lib/generated/prisma/enums';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import type { OrgContext } from '@/lib/tenant-db-helpers';
import { redirect } from 'next/navigation';

export type SessionUser = {
  id: string;
  role: UserRole;
  email: string;
  name?: string | null;
};

// Authenticated user + active organization context. Returned by
// requireOrgSession / requireOrgRole. The role here is the user's
// role WITHIN the active org (from Membership), not the legacy
// User.role field — that field is going away in PR 13.
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

// ---------- Action helpers (throw) ----------
// Use inside server actions / API routes where the call site decides
// how to surface the error (form alert, JSON 401, etc.).

export async function requireSession(): Promise<SessionUser> {
  // Route through getSession() so the per-request React.cache dedupes
  // the auth() call (which now hits getUserById on every invocation
  // post-S4). Without this, the dashboard layout + page each issued
  // their own jwt() → getUserById roundtrip.
  const session = await getSession();
  if (!session?.user?.id) throw new AuthzError('Unauthorized');
  return {
    id: session.user.id,
    role: session.user.role,
    email: session.user.email!,
    name: session.user.name,
  };
}

export async function requireRole(
  roles: readonly UserRole[]
): Promise<SessionUser> {
  const user = await requireSession();
  if (!roles.includes(user.role)) throw new AuthzError('Forbidden');
  return user;
}

export const requireAdmin = () => requireRole([UserRole.ADMIN]);
export const requireManagerOrAdmin = () =>
  requireRole([UserRole.ADMIN, UserRole.MANAGER]);

// ---------- Page helpers (redirect) ----------
// Use inside Server Component page.tsx / layout.tsx where we want
// Next's redirect() rather than a thrown error. Matches the existing
// inline pattern used in 30+ pages.

export async function requirePageSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session?.user?.id) redirect('/login');
  return {
    id: session.user.id,
    role: session.user.role,
    email: session.user.email!,
    name: session.user.name,
  };
}

export async function requirePageRole(
  roles: UserRole | readonly UserRole[]
): Promise<SessionUser> {
  const user = await requirePageSession();
  const allow = Array.isArray(roles) ? roles : [roles];
  if (!allow.includes(user.role)) redirect('/dashboard');
  return user;
}

// ---------- Predicates ----------

export const isAdmin = (user: SessionUser) => user.role === UserRole.ADMIN;
export const isManagerOrAdmin = (user: SessionUser) =>
  user.role === UserRole.ADMIN || user.role === UserRole.MANAGER;

// ---------- Org-scoped helpers (PR 4) ----------
//
// Sit alongside the existing legacy helpers. PR 5 wires activeOrgId
// into the JWT/session so these can read it; PRs 6–10 migrate every
// caller from requireSession → requireOrgSession.

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
