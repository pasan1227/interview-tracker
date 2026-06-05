// lib/actions/position.ts

'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import {
  createPosition as createPositionData,
  updatePosition as updatePositionData,
  deletePosition as deletePositionData,
} from '@/data/position';
import { UserRole } from '@/lib/generated/prisma/browser';

export async function createPosition(data: any) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Check role permission
  if (
    session.user.role !== UserRole.ADMIN &&
    session.user.role !== UserRole.MANAGER
  ) {
    throw new Error('Forbidden');
  }

  const position = await createPositionData(data);

  revalidatePath('/dashboard/positions');
  return position;
}

export async function updatePosition(id: string, data: any) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Check role permission
  if (
    session.user.role !== UserRole.ADMIN &&
    session.user.role !== UserRole.MANAGER
  ) {
    throw new Error('Forbidden');
  }

  const position = await updatePositionData(id, data);

  revalidatePath(`/dashboard/positions/${id}`);
  revalidatePath('/dashboard/positions');
  return position;
}

export async function deletePosition(id: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Check role permission
  if (
    session.user.role !== UserRole.ADMIN &&
    session.user.role !== UserRole.MANAGER
  ) {
    throw new Error('Forbidden');
  }

  await deletePositionData(id);

  revalidatePath('/dashboard/positions');
  return true;
}
