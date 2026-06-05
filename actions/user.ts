// lib/actions/user.ts

'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import {
  updateUser as updateUserData,
  deleteUser as deleteUserData,
  createUser as createUserData,
} from '@/data/user';
import { UserRole } from '@/lib/generated/prisma/browser';

export async function createUser(data: any) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
    throw new Error('Unauthorized');
  }

  const user = await createUserData(data);

  revalidatePath('/dashboard/settings/users');
  return user;
}

export async function updateUser(id: string, data: any) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Regular users can only update their own profile
  if (session.user.role !== UserRole.ADMIN && session.user.id !== id) {
    throw new Error('Forbidden');
  }

  // Regular users cannot change their role
  if (session.user.role !== UserRole.ADMIN && data.role) {
    delete data.role;
  }

  const user = await updateUserData(id, data);

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

  // Prevent deleting yourself
  if (session.user.id === id) {
    throw new Error('Cannot delete your own account');
  }

  await deleteUserData(id);

  revalidatePath('/dashboard/settings/users');
  return true;
}
