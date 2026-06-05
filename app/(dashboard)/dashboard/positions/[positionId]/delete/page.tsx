// app/(dashboard)/dashboard/positions/[id]/delete/page.tsx

import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { PositionDeleteForm } from '@/components/positions/position-delete-form';
import { UserRole } from '@/lib/generated/prisma/browser';

interface DeletePositionPageProps {
  params: Promise<{
    positionId: string;
  }>;
}

export default async function DeletePositionPage({
  params,
}: DeletePositionPageProps) {
  const session = await auth();
  const { positionId } = await params;

  if (!session || !session.user) {
    redirect('/login');
  }

  // Check if user has permission to delete positions
  if (
    session.user.role !== UserRole.ADMIN &&
    session.user.role !== UserRole.MANAGER
  ) {
    redirect('/dashboard');
  }

  // Fetch the position
  const position = await db.position.findUnique({
    where: { id: positionId },
    include: {
      workflow: true,
    },
  });

  if (!position) {
    notFound();
  }

  // Count candidates with this position
  const candidateCount = await db.candidate.count({
    where: { positionId: position.id },
  });

  // Count interviews for this position
  const interviewCount = await db.interview.count({
    where: { positionId: position.id },
  });

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Delete Position</h1>
        <p className='text-muted-foreground'>
          Are you sure you want to delete this position?
        </p>
      </div>

      <div className='rounded-md border p-6 bg-white'>
        <div className='space-y-4'>
          <div>
            <h2 className='text-xl font-bold text-red-600'>Warning</h2>
            <p className='text-muted-foreground'>
              This action cannot be undone. This will permanently delete the
              position
              <span className='font-semibold'> {position.title} </span>
              {candidateCount > 0 && (
                <>
                  and affect{' '}
                  <span className='font-semibold'>{candidateCount}</span>{' '}
                  candidates
                </>
              )}
              {interviewCount > 0 && (
                <>
                  and <span className='font-semibold'>{interviewCount}</span>{' '}
                  interviews
                </>
              )}
              .
            </p>
          </div>

          <div className='border rounded-md p-4 bg-slate-50'>
            <h3 className='font-semibold'>Position Information</h3>
            <div className='mt-2 space-y-1 text-sm'>
              <p>
                <span className='text-muted-foreground'>Title:</span>{' '}
                {position.title}
              </p>
              {position.department && (
                <p>
                  <span className='text-muted-foreground'>Department:</span>{' '}
                  {position.department}
                </p>
              )}
              <p>
                <span className='text-muted-foreground'>Workflow:</span>{' '}
                {position.workflow?.name || 'None'}
              </p>
              <p>
                <span className='text-muted-foreground'>Status:</span>{' '}
                {position.isActive ? 'Active' : 'Inactive'}
              </p>
              <p>
                <span className='text-muted-foreground'>Candidates:</span>{' '}
                {candidateCount}
              </p>
              <p>
                <span className='text-muted-foreground'>Interviews:</span>{' '}
                {interviewCount}
              </p>
            </div>
          </div>

          <PositionDeleteForm positionId={position.id} />

          <div className='flex justify-end'>
            <Button variant='outline' asChild>
              <Link href='/dashboard/positions'>Cancel</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
