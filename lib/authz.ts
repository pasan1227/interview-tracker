import { UserRole } from '@/lib/generated/prisma/browser';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export type SessionUser = {
  id: string;
  role: UserRole;
  email: string;
  name?: string | null;
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
