import { BCRYPT_COST } from '@/lib/auth-constants';
import { db } from '@/lib/db';
import { UserRole } from '@/lib/generated/prisma/browser';
import bcrypt from 'bcryptjs';

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
  role: true,
  isTwoFactorEnabled: true,
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

export async function createUser({
  name,
  email,
  password,
  role = UserRole.USER,
}: {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}) {
  const hashedPassword = await bcrypt.hash(password, BCRYPT_COST);

  return db.user.create({
    data: { name, email, password: hashedPassword, role },
    select: SAFE_USER_SELECT,
  });
}

// Fields a regular user may update on their own profile.
// Privileged fields (role, emailVerified, isTwoFactorEnabled) require adminUpdateUser.
const USER_SELF_FIELDS = ['name', 'image', 'password'] as const;
const ADMIN_FIELDS = [
  ...USER_SELF_FIELDS,
  'email',
  'role',
  'emailVerified',
] as const;

export type UpdateUserInput = Partial<{
  name: string;
  image: string;
  password: string;
}>;

export type AdminUpdateUserInput = UpdateUserInput &
  Partial<{ email: string; role: UserRole; emailVerified: Date | null }>;

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

export async function adminUpdateUser(id: string, data: AdminUpdateUserInput) {
  try {
    return await db.user.update({
      where: { id },
      data: await buildUpdateData(data, ADMIN_FIELDS),
      select: SAFE_USER_SELECT,
    });
  } catch (error) {
    console.error('Failed to update user (admin):', error);
    throw error;
  }
}

export async function deleteUser(id: string) {
  try {
    await db.user.delete({ where: { id } });
    return true;
  } catch (error) {
    console.error('Failed to delete user:', error);
    throw error;
  }
}

export type SafeUserListItem = Awaited<ReturnType<typeof getSafeUsers>>[number];

export async function getSafeUsers({ includeAdmins = false } = {}) {
  try {
    const where = includeAdmins ? {} : { role: { not: UserRole.ADMIN } };
    return await db.user.findMany({
      where,
      orderBy: { name: 'asc' },
      select: SAFE_USER_SELECT,
    });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return [];
  }
}
