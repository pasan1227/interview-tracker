'use server';

import { auth } from '@/auth';
import {
  adminUpdateUser as adminUpdateUserData,
  createUser as createUserData,
  deleteUser as deleteUserData,
  updateUser as updateUserData,
  type AdminUpdateUserInput,
  type UpdateUserInput,
} from '@/data/user';
import { UserRole } from '@/lib/generated/prisma/client';
import { revalidatePath } from 'next/cache';

type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
};

export async function createUser(data: CreateUserInput) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
    throw new Error('Unauthorized');
  }
  const user = await createUserData(data);
  revalidatePath('/dashboard/settings/users');
  return user;
}

export async function updateUser(id: string, data: AdminUpdateUserInput) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const isAdmin = session.user.role === UserRole.ADMIN;
  const isSelf = session.user.id === id;
  if (!isAdmin && !isSelf) throw new Error('Forbidden');

  const user = isAdmin
    ? await adminUpdateUserData(id, data)
    : await updateUserData(id, data as UpdateUserInput);

  revalidatePath('/dashboard/settings/users');
  revalidatePath(`/dashboard/settings/users/${id}`);
  revalidatePath('/dashboard/profile');
  return user;
}

export async function deleteUser(id: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
    throw new Error('Unauthorized');
  }
  if (session.user.id === id) {
    throw new Error('Cannot delete your own account');
  }
  await deleteUserData(id);
  revalidatePath('/dashboard/settings/users');
  return true;
}
