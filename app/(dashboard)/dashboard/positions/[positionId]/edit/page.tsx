import { notFound } from 'next/navigation';
import { requirePageRole } from '@/lib/authz';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { PositionForm } from '@/components/positions/position-form';
import { UserRole } from '@/lib/generated/prisma/browser';

interface EditPositionPageProps {
  params: Promise<{
    positionId: string;
  }>;
}

export default async function EditPositionPage({
  params,
}: EditPositionPageProps) {
  const session = await auth();
  const { positionId } = await params;

  await requirePageRole([UserRole.ADMIN, UserRole.MANAGER]);

  // Fetch the position
  const position = await db.position.findUnique({
    where: { id: positionId },
  });

  if (!position) {
    notFound();
  }

  // Fetch workflows for the dropdown
  const workflows = await db.workflow.findMany({
    orderBy: {
      name: 'asc',
    },
  });

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Edit Position</h1>
        <p className='text-muted-foreground'>Update position details</p>
      </div>

      <div className='rounded-md border p-6 bg-white'>
        <PositionForm position={position} workflows={workflows} isEdit />
      </div>
    </div>
  );
}
