import { db as baseDb } from '@/lib/db';
import { Prisma } from '@/lib/generated/prisma/browser';
// Prisma.sql + Prisma.join are runtime helpers only exported from the
// full client variant. Type-side `Prisma.*Input` types are still the
// /browser namespace above.
import { Prisma as PrismaRuntime } from '@/lib/generated/prisma/client';
import { tenantDb, type OrgContext } from '@/lib/tenant-db';

interface WorkflowWithStages
  extends Prisma.WorkflowGetPayload<{
    include: { stages: true };
  }> {
  stages: Array<Prisma.StageGetPayload<object>>;
}

export async function getWorkflows(ctx: OrgContext) {
  try {
    const db = tenantDb(ctx);
    const workflows = await db.workflow.findMany({
      include: {
        stages: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    return workflows;
  } catch (error) {
    console.error('Failed to fetch workflows:', error);
    return [];
  }
}

export async function getWorkflowById(
  ctx: OrgContext,
  id: string
): Promise<WorkflowWithStages | null> {
  try {
    const db = tenantDb(ctx);
    const workflow = await db.workflow.findUnique({
      where: { id },
      include: {
        stages: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return workflow;
  } catch (error) {
    console.error('Failed to fetch workflow:', error);
    return null;
  }
}

export async function getDefaultWorkflow(
  ctx: OrgContext
): Promise<WorkflowWithStages | null> {
  try {
    const db = tenantDb(ctx);
    const workflow = await db.workflow.findFirst({
      where: { isDefault: true },
      include: {
        stages: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return workflow;
  } catch (error) {
    console.error('Failed to fetch default workflow:', error);
    return null;
  }
}

export async function createWorkflow(
  ctx: OrgContext,
  data: Prisma.WorkflowCreateInput
) {
  try {
    const db = tenantDb(ctx);
    // If this is set as default, clear any other default in this org.
    // The org scope falls out of tenantDb's updateMany rewrite.
    if (data.isDefault) {
      await db.workflow.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const workflow = await db.workflow.create({
      data,
      include: {
        stages: true,
      },
    });

    return workflow;
  } catch (error) {
    console.error('Failed to create workflow:', error);
    throw error;
  }
}

export async function updateWorkflow(
  ctx: OrgContext,
  id: string,
  data: Prisma.WorkflowUpdateInput
) {
  try {
    const db = tenantDb(ctx);
    // If this is set as default, clear any other default in this org.
    if (data.isDefault === true) {
      await db.workflow.updateMany({
        where: {
          isDefault: true,
          id: { not: id },
        },
        data: { isDefault: false },
      });
    }

    const workflow = await db.workflow.update({
      where: { id },
      data,
      include: {
        stages: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return workflow;
  } catch (error) {
    console.error('Failed to update workflow:', error);
    throw error;
  }
}

export async function deleteWorkflow(ctx: OrgContext, id: string) {
  try {
    const db = tenantDb(ctx);
    // Check if this is the default workflow (in this org).
    const workflow = await db.workflow.findUnique({
      where: { id },
      select: { isDefault: true },
    });

    if (workflow?.isDefault) {
      throw new Error('Cannot delete the default workflow');
    }

    // Delete the workflow and all its stages (cascade delete).
    await db.workflow.delete({
      where: { id },
    });

    return true;
  } catch (error) {
    console.error('Failed to delete workflow:', error);
    throw error;
  }
}

// Order is server-computed, so callers don't pass it.
export async function createStage(
  ctx: OrgContext,
  data: Omit<Prisma.StageCreateInput, 'order'>
) {
  try {
    const db = tenantDb(ctx);
    const highestOrderStage = await db.stage.findFirst({
      where: { workflowId: data.workflow.connect!.id },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const order = highestOrderStage ? highestOrderStage.order + 1 : 0;

    const stage = await db.stage.create({
      data: { ...data, order },
    });

    return stage;
  } catch (error) {
    console.error('Failed to create stage:', error);
    throw error;
  }
}

export async function updateStage(
  ctx: OrgContext,
  id: string,
  data: Prisma.StageUpdateInput
) {
  try {
    const db = tenantDb(ctx);
    const stage = await db.stage.update({
      where: { id },
      data,
    });

    return stage;
  } catch (error) {
    console.error('Failed to update stage:', error);
    throw error;
  }
}

export async function deleteStage(ctx: OrgContext, id: string) {
  try {
    const db = tenantDb(ctx);
    // Get the stage to be deleted (org-scoped).
    const stage = await db.stage.findUnique({
      where: { id },
      select: { workflowId: true, order: true },
    });

    if (!stage) {
      throw new Error('Stage not found');
    }

    // Delete the stage (org-scoped via tenantDb).
    await db.stage.delete({
      where: { id },
    });

    // Reorder remaining stages. Raw SQL bypasses tenantDb, so we
    // include the org scope explicitly in the WHERE clause.
    await baseDb.$executeRaw`
      UPDATE "Stage"
      SET "order" = "order" - 1
      WHERE "workflowId" = ${stage.workflowId}
      AND "organizationId" = ${ctx.organizationId}
      AND "order" > ${stage.order}
    `;

    return true;
  } catch (error) {
    console.error('Failed to delete stage:', error);
    throw error;
  }
}

export async function reorderStages(
  ctx: OrgContext,
  workflowId: string,
  stageIds: string[]
) {
  if (stageIds.length === 0) return true;
  try {
    // Single-statement reorder. Raw SQL bypasses tenantDb, so the
    // org scope is added to the WHERE clause explicitly — even if a
    // stale stageId from another org's workflow is passed in, the
    // composite filter rejects it.
    const tuples = stageIds.map(
      (id, idx) => PrismaRuntime.sql`(${id}::text, ${idx}::int)`
    );
    await baseDb.$executeRaw`
      UPDATE "Stage" AS s
      SET "order" = c.new_order
      FROM (VALUES ${PrismaRuntime.join(tuples)}) AS c(id, new_order)
      WHERE s."id" = c.id
        AND s."workflowId" = ${workflowId}
        AND s."organizationId" = ${ctx.organizationId}
    `;
    return true;
  } catch (error) {
    console.error('Failed to reorder stages:', error);
    throw error;
  }
}
