import type { Prisma } from '@/lib/generated/prisma/browser';
import { tenantDb, type OrgContext } from '@/lib/tenant-db';

export async function getPositions(
  ctx: OrgContext,
  {
    activeOnly = true,
    includeWorkflow = false,
  }: { activeOnly?: boolean; includeWorkflow?: boolean } = {}
) {
  try {
    const db = tenantDb(ctx);
    const where = activeOnly ? { isActive: true } : {};

    const positions = await db.position.findMany({
      where,
      include: {
        workflow: includeWorkflow,
      },
      orderBy: { title: 'asc' },
    });

    return positions;
  } catch (error) {
    console.error('Failed to fetch positions:', error);
    return [];
  }
}

export async function getPositionById(
  ctx: OrgContext,
  id: string,
  includeWorkflow = false
) {
  try {
    const db = tenantDb(ctx);
    const position = await db.position.findUnique({
      where: { id },
      include: {
        workflow: includeWorkflow,
      },
    });

    return position;
  } catch (error) {
    console.error('Failed to fetch position:', error);
    return null;
  }
}

export async function createPosition(
  ctx: OrgContext,
  data: Prisma.PositionCreateInput
) {
  try {
    const db = tenantDb(ctx);
    return await db.position.create({ data });
  } catch (error) {
    console.error('Failed to create position:', error);
    throw error;
  }
}

export async function updatePosition(
  ctx: OrgContext,
  id: string,
  data: Prisma.PositionUpdateInput
) {
  try {
    const db = tenantDb(ctx);
    return await db.position.update({ where: { id }, data });
  } catch (error) {
    console.error('Failed to update position:', error);
    throw error;
  }
}

export async function deletePosition(ctx: OrgContext, id: string) {
  try {
    const db = tenantDb(ctx);
    await db.position.delete({
      where: { id },
    });

    return true;
  } catch (error) {
    console.error('Failed to delete position:', error);
    throw error;
  }
}
