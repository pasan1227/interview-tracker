'use server';

import {
  createStage as createStageData,
  createWorkflow as createWorkflowData,
  deleteStage as deleteStageData,
  deleteWorkflow as deleteWorkflowData,
  reorderStages as reorderStagesData,
  updateStage as updateStageData,
  updateWorkflow as updateWorkflowData,
} from '@/data/workflow';
import { requireAdmin } from '@/lib/authz';
import { db } from '@/lib/db';
import {
  StageInputSchema,
  WorkflowInputSchema,
  type StageInput,
  type WorkflowInput,
} from '@/lib/validations/dashboard';
import { revalidateWorkflow } from '@/lib/revalidate';
import { z } from 'zod';

// Bulk-reorder accepts an ordered list of stage IDs; cap it to keep
// the transaction bounded.
const ReorderSchema = z.array(z.string().cuid()).max(200);

// ---------- Workflows ----------

export async function createWorkflow(input: WorkflowInput) {
  await requireAdmin();
  const data = WorkflowInputSchema.parse(input);

  const workflow = await createWorkflowData({
    name: data.name,
    description: data.description ?? null,
    isDefault: data.isDefault ?? false,
  });

  revalidateWorkflow();
  return workflow;
}

export async function updateWorkflow(id: string, input: WorkflowInput) {
  await requireAdmin();
  const data = WorkflowInputSchema.parse(input);

  const workflow = await updateWorkflowData(id, {
    name: data.name,
    description: data.description ?? null,
    isDefault: data.isDefault ?? false,
  });

  revalidateWorkflow(id);
  return workflow;
}

export async function deleteWorkflow(id: string) {
  await requireAdmin();
  await deleteWorkflowData(id);
  revalidateWorkflow();
  return true;
}

/**
 * Mark this workflow as the default. Lives separately from updateWorkflow
 * so the create/update schema can stay strict — toggling default doesn't
 * need to round-trip the name and description.
 */
export async function setWorkflowAsDefault(id: string) {
  await requireAdmin();
  const wfId = z.string().cuid().parse(id);
  await updateWorkflowData(wfId, { isDefault: true });
  revalidateWorkflow(wfId);
  return true;
}

// ---------- Stages ----------
//
// Stages are owned by a workflow. The action takes workflowId as a
// separate, server-validated argument so the client can't smuggle in a
// different workflow via the data payload (mass assignment).

export async function createStage(workflowId: string, input: StageInput) {
  await requireAdmin();
  const data = StageInputSchema.parse(input);
  const wfId = z.string().cuid().parse(workflowId);

  const stage = await createStageData({
    name: data.name,
    description: data.description ?? null,
    workflow: { connect: { id: wfId } },
  });

  revalidateWorkflow(wfId);
  return stage;
}

export async function updateStage(id: string, input: StageInput) {
  await requireAdmin();
  const data = StageInputSchema.parse(input);

  const stage = await updateStageData(id, {
    name: data.name,
    description: data.description ?? null,
  });

  // Look up the workflowId so we know which detail page to revalidate.
  const updated = await db.stage.findUnique({
    where: { id },
    select: { workflowId: true },
  });
  if (updated) {
    revalidateWorkflow(updated.workflowId);
  }

  return stage;
}

export async function deleteStage(id: string, workflowId: string) {
  await requireAdmin();
  const wfId = z.string().cuid().parse(workflowId);
  await deleteStageData(id);
  revalidateWorkflow(wfId);
  return true;
}

export async function reorderStages(workflowId: string, stageIds: string[]) {
  await requireAdmin();
  const wfId = z.string().cuid().parse(workflowId);
  const ids = ReorderSchema.parse(stageIds);
  await reorderStagesData(wfId, ids);
  revalidateWorkflow(wfId);
  return true;
}
