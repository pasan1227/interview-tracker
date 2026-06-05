// app/(dashboard)/dashboard/positions/new/page.tsx

import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { PositionForm } from '@/components/positions/position-form';
import { UserRole } from '@/lib/generated/prisma/browser';
import { db } from '@/lib/db';

export default async function NewPositionPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect('/login');
  }

  // Check if user has permission to access this page
  if (
    session.user.role !== UserRole.ADMIN &&
    session.user.role !== UserRole.MANAGER
  ) {
    redirect('/dashboard');
  }

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
