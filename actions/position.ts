'use server';

import {
  createPosition as createPositionData,
  deletePosition as deletePositionData,
  updatePosition as updatePositionData,
} from '@/data/position';
import { getStagesForPosition as getStagesForPositionData } from '@/data/interview';
import { requireManagerOrAdmin, requireSession } from '@/lib/authz';
import {
  PositionInputSchema,
  type PositionInput,
} from '@/lib/validations/dashboard';
import { revalidatePath } from 'next/cache';

/**
 * Workflow stages for the given position, used by the interview form to
 * populate the stage dropdown when the user picks a position. Read-only;
 * any authenticated user may call it.
 *
 * (Originally added in PR #16. Included here so this branch carries the
 * full union — see the PR description for the dependency note.)
 */
export async function getStagesForPosition(positionId: string) {
  await requireSession();
  const stages = await getStagesForPositionData(positionId);
  return stages.map((s) => ({ id: s.id, name: s.name, order: s.order }));
}

export async function createPosition(input: PositionInput) {
  await requireManagerOrAdmin();
  const data = PositionInputSchema.parse(input);

  const position = await createPositionData({
    title: data.title,
    department: data.department ?? null,
    workflow: data.workflowId
      ? { connect: { id: data.workflowId } }
      : undefined,
    isActive: data.isActive ?? true,
  });

  revalidatePath('/dashboard/positions');
  return position;
}

export async function updatePosition(id: string, input: PositionInput) {
  await requireManagerOrAdmin();
  const data = PositionInputSchema.parse(input);

  const position = await updatePositionData(id, {
    title: data.title,
    department: data.department ?? null,
    workflow: data.workflowId
      ? { connect: { id: data.workflowId } }
      : { disconnect: true },
    isActive: data.isActive ?? true,
  });

  revalidatePath(`/dashboard/positions/${id}`);
  revalidatePath('/dashboard/positions');
  return position;
}

export async function deletePosition(id: string) {
  await requireManagerOrAdmin();
  await deletePositionData(id);
  revalidatePath('/dashboard/positions');
  return true;
}
