// app/(dashboard)/dashboard/positions/new/page.tsx

import { PositionForm } from '@/components/positions/position-form';
import { requirePageRole } from '@/lib/authz';
import { UserRole } from '@/lib/generated/prisma/browser';
import { db } from '@/lib/db';

export default async function NewPositionPage() {
  await requirePageRole([UserRole.ADMIN, UserRole.MANAGER]);

  const workflows = await db.workflow.findMany({
    orderBy: {
      name: 'asc',
    },
  });

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Add New Position</h1>
        <p className='text-muted-foreground'>
          Create a new position for candidates
        </p>
      </div>

      <div className='rounded-md border p-6 bg-white'>
        <PositionForm workflows={workflows} />
      </div>
    </div>
  );
}
