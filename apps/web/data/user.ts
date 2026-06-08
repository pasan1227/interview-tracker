import { BCRYPT_COST } from '@/lib/auth-constants';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// PR 13: User.role + UserRole enum are gone. Authorization lives on
// the Membership table (per-org OrganizationRole). createUser and
// deleteUser were callers of the legacy admin-edits-any-user flow,
// which the invite/revoke flow in actions/org/* replaces.

export async function getUserByEmail(email: string) {
  try {
    return await db.user.findUnique({ where: { email } });
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return null;
  }
}

export async function getUserById(id: string) {
  try {
    return await db.user.findUnique({ where: { id } });
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    return null;
  }
}

// Use this anywhere the result might flow to a client component, an admin
// page that renders the user object, or anywhere else that doesn't need
// the bcrypt hash. Selecting a column-list excludes `password` at the DB
// boundary instead of relying on every caller to scrub it.
export const SAFE_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  emailVerified: true,
  image: true,
  isTwoFactorEnabled: true,
  isPlatformAdmin: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type SafeUser = NonNullable<Awaited<ReturnType<typeof getSafeUserById>>>;

export async function getSafeUserById(id: string) {
  try {
    return await db.user.findUnique({
      where: { id },
      select: SAFE_USER_SELECT,
    });
  } catch (error) {
    console.error('Error fetching safe user by ID:', error);
    return null;
  }
}

// Server-side only: returns the bcrypt hash for currentPassword verification.
// Never pass the result to a client component / serialize it into a prop.
export async function getUserPasswordHash(id: string) {
  try {
    const row = await db.user.findUnique({
      where: { id },
      select: { password: true },
    });
    return row?.password ?? null;
  } catch (error) {
    console.error('Error fetching user password hash:', error);
    return null;
  }
}

// Fields a user may update on their own profile.
const USER_SELF_FIELDS = ['name', 'image', 'password'] as const;

export type UpdateUserInput = Partial<{
  name: string;
  image: string;
  password: string;
}>;

async function buildUpdateData(
  data: Record<string, unknown>,
  allowed: readonly string[]
) {
  const out: Record<string, unknown> = {};
  for (const field of allowed) {
    if (!(field in data)) continue;
    const value = data[field];
    if (value === undefined) continue;
    out[field] =
      field === 'password'
        ? await bcrypt.hash(value as string, BCRYPT_COST)
        : value;
  }
  return out;
}

export async function updateUser(id: string, data: UpdateUserInput) {
  try {
    return await db.user.update({
      where: { id },
      data: await buildUpdateData(data, USER_SELF_FIELDS),
      select: SAFE_USER_SELECT,
    });
  } catch (error) {
    console.error('Failed to update user:', error);
    throw error;
  }
}
