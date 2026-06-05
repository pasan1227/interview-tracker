// app/(dashboard)/dashboard/settings/workflows/[workflowId]/stages/[stageId]/delete/page.tsx

import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { StageDeleteForm } from '@/components/workflows/stage-delete-form';
import { UserRole } from '@/lib/generated/prisma/browser';

interface DeleteStagePageProps {
  params: Promise<{
    workflowId: string;
    stageId: string;
  }>;
}

export default async function DeleteStagePage({
  params,
}: DeleteStagePageProps) {
  const session = await auth();
  const { workflowId, stageId } = await params;

  if (!session || !session.user) {
    redirect('/login');
  }

  // Check if user has permission to access this page
  if (session.user.role !== UserRole.ADMIN) {
    redirect('/dashboard');
  }

  // Get the stage and workflow
  const stage = await db.stage.findUnique({
    where: {
      id: stageId,
      workflowId: workflowId,
    },
    include: {
      workflow: true,
    },
  });

  if (!stage) {
    notFound();
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Delete Stage</h1>
        <p className='text-muted-foreground'>
          Are you sure you want to delete this interview stage?
        </p>
      </div>

      <div className='rounded-md border p-6 bg-white'>
        <div className='space-y-4'>
          <div>
            <h2 className='text-xl font-bold text-red-600'>Warning</h2>
            <p className='text-muted-foreground'>
              This action cannot be undone. This will permanently delete the
              stage
              <span className='font-semibold'> {stage.name} </span>
              from the workflow
              <span className='font-semibold'> {stage.workflow.name}</span>. Any
              interviews associated with this stage will lose their stage
              reference.
            </p>
          </div>

          <div className='border rounded-md p-4 bg-slate-50'>
            <h3 className='font-semibold'>Stage Information</h3>
            <div className='mt-2 space-y-1 text-sm'>
              <p>
                <span className='text-muted-foreground'>Name:</span>{' '}
                {stage.name}
              </p>
              {stage.description && (
                <p>
                  <span className='text-muted-foreground'>Description:</span>{' '}
                  {stage.description}
                </p>
              )}
              <p>
                <span className='text-muted-foreground'>Order:</span>{' '}
                {stage.order + 1}
              </p>
            </div>
          </div>

          <StageDeleteForm
            stageId={stageId}
            workflowId={workflowId}
          />

          <div className='flex justify-end'>
            <Button variant='outline' asChild>
              <Link href={`/dashboard/settings/workflows/${workflowId}`}>
                Cancel
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
