'use server';

import {
  createPosition as createPositionData,
  deletePosition as deletePositionData,
  updatePosition as updatePositionData,
} from '@/data/position';
import { requireManagerOrAdmin } from '@/lib/authz';
import { getDefaultOrganizationId } from '@/lib/default-org';
import { revalidatePosition } from '@/lib/revalidate';
import {
  PositionInputSchema,
  type PositionInput,
} from '@/lib/validations/dashboard';

export async function createPosition(input: PositionInput) {
  await requireManagerOrAdmin();
  const data = PositionInputSchema.parse(input);
  // Bridge until PR 7 threads OrgContext through this action.
  const organizationId = await getDefaultOrganizationId();

  const position = await createPositionData({
    title: data.title,
    department: data.department ?? null,
    workflow: data.workflowId
      ? { connect: { id: data.workflowId } }
      : undefined,
    isActive: data.isActive ?? true,
    organization: { connect: { id: organizationId } },
  });

  revalidatePosition();
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

  revalidatePosition(id);
  return position;
}

export async function deletePosition(id: string) {
  await requireManagerOrAdmin();
  await deletePositionData(id);
  revalidatePosition();
  return true;
}
