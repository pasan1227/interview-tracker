'use server';

import {
  createPosition as createPositionData,
  deletePosition as deletePositionData,
  updatePosition as updatePositionData,
} from '@/data/position';
import { requireOrgManagerOrAdmin, toOrgContext } from '@/lib/authz';
import { revalidatePosition } from '@/lib/revalidate';
import {
  PositionInputSchema,
  type PositionInput,
} from '@/lib/validations/dashboard';

export async function createPosition(input: PositionInput) {
  const user = await requireOrgManagerOrAdmin();
  const ctx = toOrgContext(user);
  const data = PositionInputSchema.parse(input);

  // organizationId injected by tenantDb. Workflow connect is scoped
  // by tenantDb's where-merge — picking a workflow id from another
  // org silently fails (returns no row).
  const position = await createPositionData(ctx, {
    title: data.title,
    department: data.department ?? null,
    workflow: data.workflowId
      ? { connect: { id: data.workflowId } }
      : undefined,
    isActive: data.isActive ?? true,
    organization: { connect: { id: ctx.organizationId } },
  });

  revalidatePosition();
  return position;
}

export async function updatePosition(id: string, input: PositionInput) {
  const user = await requireOrgManagerOrAdmin();
  const ctx = toOrgContext(user);
  const data = PositionInputSchema.parse(input);

  const position = await updatePositionData(ctx, id, {
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
  const user = await requireOrgManagerOrAdmin();
  const ctx = toOrgContext(user);
  await deletePositionData(ctx, id);
  revalidatePosition();
  return true;
}
