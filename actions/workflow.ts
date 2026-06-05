// lib/actions/workflow.ts

'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import {
  createWorkflow as createWorkflowData,
  updateWorkflow as updateWorkflowData,
  deleteWorkflow as deleteWorkflowData,
  createStage as createStageData,
  updateStage as updateStageData,
  deleteStage as deleteStageData,
  reorderStages as reorderStagesData,
} from '@/data/workflow';
import { UserRole } from '@/lib/generated/prisma/browser';
import { db } from '@/lib/db';

export async function createWorkflow(data: any) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Check role permission
  if (session.user.role !== UserRole.ADMIN) {
    throw new Error('Forbidden');
  }

  const workflow = await createWorkflowData(data);

  revalidatePath('/dashboard/settings/workflows');
  return workflow;
}

export async function updateWorkflow(id: string, data: any) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Check role permission
  if (session.user.role !== UserRole.ADMIN) {
    throw new Error('Forbidden');
  }

  const workflow = await updateWorkflowData(id, data);

  revalidatePath(`/dashboard/settings/workflows/${id}`);
  revalidatePath('/dashboard/settings/workflows');
  return workflow;
}

export async function deleteWorkflow(id: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Check role permission
  if (session.user.role !== UserRole.ADMIN) {
    throw new Error('Forbidden');
  }

  await deleteWorkflowData(id);

  revalidatePath('/dashboard/settings/workflows');
  return true;
}

export async function createStage(data: any) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Check role permission
  if (session.user.role !== UserRole.ADMIN) {
    throw new Error('Forbidden');
  }

  const stage = await createStageData(data);

  revalidatePath(`/dashboard/settings/workflows/${data.workflow.connect.id}`);
  return stage;
}

export async function updateStage(id: string, data: any) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Check role permission
  if (session.user.role !== UserRole.ADMIN) {
    throw new Error('Forbidden');
  }

  const stage = await updateStageData(id, data);

  // We need the workflowId to properly revalidate
  const updatedStage = await db.stage.findUnique({
    where: { id },
    select: { workflowId: true },
  });

  if (updatedStage) {
    revalidatePath(`/dashboard/settings/workflows/${updatedStage.workflowId}`);
  }

  return stage;
}

export async function deleteStage(id: string, workflowId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Check role permission
  if (session.user.role !== UserRole.ADMIN) {
    throw new Error('Forbidden');
  }

  await deleteStageData(id);

  revalidatePath(`/dashboard/settings/workflows/${workflowId}`);
  return true;
}

export async function reorderStages(workflowId: string, stageIds: string[]) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Check role permission
  if (session.user.role !== UserRole.ADMIN) {
    throw new Error('Forbidden');
  }

  await reorderStagesData(workflowId, stageIds);

  revalidatePath(`/dashboard/settings/workflows/${workflowId}`);
  return true;
}
