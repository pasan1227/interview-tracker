// lib/data/workflow.ts

import { db } from '@/lib/db';
import { Prisma } from '@/lib/generated/prisma/browser';

interface WorkflowWithStages
  extends Prisma.WorkflowGetPayload<{
    include: { stages: true };
  }> {
  stages: Array<Prisma.StageGetPayload<object>>;
}

export async function getWorkflows() {
  try {
    const workflows = await db.workflow.findMany({
      include: {
        stages: {
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return workflows;
  } catch (error) {
    console.error('Failed to fetch workflows:', error);
    return [];
  }
}

export async function getWorkflowById(
  id: string
): Promise<WorkflowWithStages | null> {
  try {
    const workflow = await db.workflow.findUnique({
      where: { id },
      include: {
        stages: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return workflow;
  } catch (error) {
    console.error('Failed to fetch workflow:', error);
    return null;
  }
}

export async function getDefaultWorkflow(): Promise<WorkflowWithStages | null> {
  try {
    const workflow = await db.workflow.findFirst({
      where: { isDefault: true },
      include: {
        stages: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return workflow;
  } catch (error) {
    console.error('Failed to fetch default workflow:', error);
    return null;
  }
}

export async function createWorkflow(data: Prisma.WorkflowCreateInput) {
  try {
    // If this is set as default, update any existing default workflows
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
  id: string,
  data: Prisma.WorkflowUpdateInput
) {
  try {
    // If this is set as default, update any existing default workflows
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
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return workflow;
  } catch (error) {
    console.error('Failed to update workflow:', error);
    throw error;
  }
}

export async function deleteWorkflow(id: string) {
  try {
    // Check if this is the default workflow
    const workflow = await db.workflow.findUnique({
      where: { id },
      select: { isDefault: true },
    });

    if (workflow?.isDefault) {
      throw new Error('Cannot delete the default workflow');
    }

    // Delete the workflow and all its stages (cascade delete)
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
export async function createStage(data: Omit<Prisma.StageCreateInput, 'order'>) {
  try {
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

export async function updateStage(id: string, data: Prisma.StageUpdateInput) {
  try {
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

export async function deleteStage(id: string) {
  try {
    // Get the stage to be deleted
    const stage = await db.stage.findUnique({
      where: { id },
      select: { workflowId: true, order: true },
    });

    if (!stage) {
      throw new Error('Stage not found');
    }

    // Delete the stage
    await db.stage.delete({
      where: { id },
    });

    // Reorder remaining stages
    await db.$executeRaw`
      UPDATE "Stage"
      SET "order" = "order" - 1
      WHERE "workflowId" = ${stage.workflowId}
      AND "order" > ${stage.order}
    `;

    return true;
  } catch (error) {
    console.error('Failed to delete stage:', error);
    throw error;
  }
}

export async function reorderStages(workflowId: string, stageIds: string[]) {
  try {
    // Update the order of stages based on the provided array order
    await db.$transaction(
      stageIds.map((stageId, index) =>
        db.stage.update({
          where: { id: stageId },
          data: { order: index },
        })
      )
    );

    return true;
  } catch (error) {
    console.error('Failed to reorder stages:', error);
    throw error;
  }
}
