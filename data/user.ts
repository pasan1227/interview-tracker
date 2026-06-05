import { BCRYPT_COST } from '@/lib/auth-constants';
import { db } from '@/lib/db';
import { UserRole } from '@/lib/generated/prisma/client';
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
  });
}

// Fields a regular user may update on their own profile.
// Privileged fields (role, emailVerified, isTwoFactorEnabled) require adminUpdateUser.
const USER_SELF_FIELDS = ['name', 'email', 'image', 'password'] as const;
const ADMIN_FIELDS = [...USER_SELF_FIELDS, 'role'] as const;

export type UpdateUserInput = Partial<{
  name: string;
  email: string;
  image: string;
  password: string;
}>;

export type AdminUpdateUserInput = UpdateUserInput & { role?: UserRole };

async function buildUpdateData(
  data: Record<string, unknown>,
  allowed: readonly string[]
) {
  const out: Record<string, unknown> = {};
  for (const field of allowed) {
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

export async function getUsers({ includeAdmins = false } = {}) {
  try {
    const where = includeAdmins ? {} : { role: { not: UserRole.ADMIN } };
    return await db.user.findMany({ where, orderBy: { name: 'asc' } });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return [];
  }
}
