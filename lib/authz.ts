import { auth } from '@/auth';
import { UserRole } from '@/lib/generated/prisma/client';

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

export async function requireSession(): Promise<SessionUser> {
  const session = await auth();
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

export const isAdmin = (user: SessionUser) => user.role === UserRole.ADMIN;
export const isManagerOrAdmin = (user: SessionUser) =>
  user.role === UserRole.ADMIN || user.role === UserRole.MANAGER;
