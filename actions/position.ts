'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import {
  createPosition as createPositionData,
  updatePosition as updatePositionData,
  deletePosition as deletePositionData,
} from '@/data/position';
import { getStagesForPosition as getStagesForPositionData } from '@/data/interview';
import { requireSession } from '@/lib/authz';
import { UserRole } from '@/lib/generated/prisma/browser';

/**
 * Workflow stages for the given position, used by the interview form to
 * populate the stage dropdown when the user picks a position. Read-only;
 * any authenticated user may call it.
 */
export async function getStagesForPosition(positionId: string) {
  await requireSession();
  const stages = await getStagesForPositionData(positionId);
  // Slim the payload to what the form actually uses.
  return stages.map((s) => ({ id: s.id, name: s.name, order: s.order }));
}

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
