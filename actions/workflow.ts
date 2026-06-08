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
import { requireOrgAdmin, toOrgContext } from '@/lib/authz';
import {
  StageInputSchema,
  WorkflowInputSchema,
  type StageInput,
  type WorkflowInput,
} from '@/lib/validations/dashboard';
import { revalidateWorkflow } from '@/lib/revalidate';
import { tenantDb } from '@/lib/tenant-db';
import { z } from 'zod';

// Bulk-reorder accepts an ordered list of stage IDs; cap it to keep
// the transaction bounded.
const ReorderSchema = z.array(z.string().cuid()).max(200);

// ---------- Workflows ----------

export async function createWorkflow(input: WorkflowInput) {
  const user = await requireOrgAdmin();
  const ctx = toOrgContext(user);
  const data = WorkflowInputSchema.parse(input);

  const workflow = await createWorkflowData(ctx, {
    name: data.name,
    description: data.description ?? null,
    isDefault: data.isDefault ?? false,
    organization: { connect: { id: ctx.organizationId } },
  });

  revalidateWorkflow();
  return workflow;
}

export async function updateWorkflow(id: string, input: WorkflowInput) {
  const user = await requireOrgAdmin();
  const ctx = toOrgContext(user);
  const data = WorkflowInputSchema.parse(input);

  const workflow = await updateWorkflowData(ctx, id, {
    name: data.name,
    description: data.description ?? null,
    isDefault: data.isDefault ?? false,
  });

  revalidateWorkflow(id);
  return workflow;
}

export async function deleteWorkflow(id: string) {
  const user = await requireOrgAdmin();
  const ctx = toOrgContext(user);
  await deleteWorkflowData(ctx, id);
  revalidateWorkflow();
  return true;
}

/**
 * Mark this workflow as the default. Lives separately from updateWorkflow
 * so the create/update schema can stay strict — toggling default doesn't
 * need to round-trip the name and description.
 */
export async function setWorkflowAsDefault(id: string) {
  const user = await requireOrgAdmin();
  const ctx = toOrgContext(user);
  const wfId = z.string().cuid().parse(id);
  await updateWorkflowData(ctx, wfId, { isDefault: true });
  revalidateWorkflow(wfId);
  return true;
}

// ---------- Stages ----------
//
// Stages are owned by a workflow. The action takes workflowId as a
// separate, server-validated argument so the client can't smuggle in a
// different workflow via the data payload (mass assignment).

export async function createStage(workflowId: string, input: StageInput) {
  const user = await requireOrgAdmin();
  const ctx = toOrgContext(user);
  const data = StageInputSchema.parse(input);
  const wfId = z.string().cuid().parse(workflowId);

  // Verify the workflow is in our org before letting createStage
  // connect to it. tenantDb's findUnique returns null cross-org.
  const workflow = await tenantDb(ctx).workflow.findUnique({
    where: { id: wfId },
    select: { id: true },
  });
  if (!workflow) throw new Error('Workflow not found');

  const stage = await createStageData(ctx, {
    name: data.name,
    description: data.description ?? null,
    workflow: { connect: { id: wfId } },
    organization: { connect: { id: ctx.organizationId } },
  });

  revalidateWorkflow(wfId);
  return stage;
}

export async function updateStage(id: string, input: StageInput) {
  const user = await requireOrgAdmin();
  const ctx = toOrgContext(user);
  const data = StageInputSchema.parse(input);

  const stage = await updateStageData(ctx, id, {
    name: data.name,
    description: data.description ?? null,
  });

  // Look up the workflowId so we know which detail page to revalidate.
  const updated = await tenantDb(ctx).stage.findUnique({
    where: { id },
    select: { workflowId: true },
  });
  if (updated) {
    revalidateWorkflow(updated.workflowId);
  }

  return stage;
}

export async function deleteStage(id: string, workflowId: string) {
  const user = await requireOrgAdmin();
  const ctx = toOrgContext(user);
  const wfId = z.string().cuid().parse(workflowId);
  await deleteStageData(ctx, id);
  revalidateWorkflow(wfId);
  return true;
}

export async function reorderStages(workflowId: string, stageIds: string[]) {
  const user = await requireOrgAdmin();
  const ctx = toOrgContext(user);
  const wfId = z.string().cuid().parse(workflowId);
  const ids = ReorderSchema.parse(stageIds);
  await reorderStagesData(ctx, wfId, ids);
  revalidateWorkflow(wfId);
  return true;
}
