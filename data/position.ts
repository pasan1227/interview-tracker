import { db } from '@/lib/db';
import type { Prisma } from '@/lib/generated/prisma/browser';

export async function getPositions({
  activeOnly = true,
  includeWorkflow = false,
} = {}) {
  try {
    const where = activeOnly ? { isActive: true } : {};

    const positions = await db.position.findMany({
      where,
      include: {
        workflow: includeWorkflow,
      },
      orderBy: {
        title: 'asc',
      },
    });

    return positions;
  } catch (error) {
    console.error('Failed to fetch positions:', error);
    return [];
  }
}

export async function getPositionById(id: string, includeWorkflow = false) {
  try {
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

export async function createPosition(data: Prisma.PositionCreateInput) {
  try {
    return await db.position.create({ data });
  } catch (error) {
    console.error('Failed to create position:', error);
    throw error;
  }
}

export async function updatePosition(
  id: string,
  data: Prisma.PositionUpdateInput
) {
  try {
    return await db.position.update({ where: { id }, data });
  } catch (error) {
    console.error('Failed to update position:', error);
    throw error;
  }
}

export async function deletePosition(id: string) {
  try {
    await db.position.delete({
      where: { id },
    });

    return true;
  } catch (error) {
    console.error('Failed to delete position:', error);
    throw error;
  }
}
