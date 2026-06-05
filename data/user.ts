import { db } from '@/lib/db';
import { UserRole } from '@/lib/generated/prisma/browser';
import bcrypt from 'bcryptjs';

export async function getUserByEmail(email: string) {
  try {
    const user = await db?.user?.findUnique({
      where: { email },
    });
    return user;
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return null;
  }
}

export async function getUserById(id: string) {
  try {
    const user = await db?.user?.findUnique({
      where: { id },
    });
    return user;
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
  const hashedPassword = await bcrypt.hash(password, 10);

  return db?.user?.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
    },
  });
}

export async function updateUser(id: string, data: any) {
  try {
    // If password is being updated, hash it
    const updateData = { ...data };

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const user = await db.user.update({
      where: { id },
      data: updateData,
    });

    return user;
  } catch (error) {
    console.error('Failed to update user:', error);
    throw error;
  }
}

export async function deleteUser(id: string) {
  try {
    await db.user.delete({
      where: { id },
    });

    return true;
  } catch (error) {
    console.error('Failed to delete user:', error);
    throw error;
  }
}

export async function getUsers({ includeAdmins = false } = {}) {
  try {
    // By default, exclude admin users for safety
    const where = includeAdmins
      ? {}
      : {
          role: {
            not: UserRole.ADMIN,
          },
        };

    const users = await db.user.findMany({
      where,
      orderBy: {
        name: 'asc',
      },
    });

    return users;
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return [];
  }
}