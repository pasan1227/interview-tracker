// app/(dashboard)/dashboard/settings/workflows/[id]/delete/page.tsx

import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getWorkflowById } from '@/data/workflow';
import { Button } from '@/components/ui/button';
import { WorkflowDeleteForm } from '@/components/workflows/workflow-delete-form';
import { UserRole } from '@/lib/generated/prisma/browser';

interface DeleteWorkflowPageProps {
  params: Promise<{
    workflowId: string;
  }>;
}

export default async function DeleteWorkflowPage({
  params,
}: DeleteWorkflowPageProps) {
  const session = await auth();
  const { workflowId } = await params;

  if (!session || !session.user) {
    redirect('/login');
  }

  // Check if user has permission to access this page
  if (session.user.role !== UserRole.ADMIN) {
    redirect('/dashboard');
  }

  const workflow = await getWorkflowById(workflowId);

  if (!workflow) {
    notFound();
  }

  // Prevent deletion of default workflow
  if (workflow.isDefault) {
    redirect(`/dashboard/settings/workflows/${workflow.id}`);
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Delete Workflow</h1>
        <p className='text-muted-foreground'>
          Are you sure you want to delete this workflow?
        </p>
      </div>

      <div className='rounded-md border p-6 bg-white'>
        <div className='space-y-4'>
          <div>
            <h2 className='text-xl font-bold text-red-600'>Warning</h2>
            <p className='text-muted-foreground'>
              This action cannot be undone. This will permanently delete the
              workflow
              <span className='font-semibold'> {workflow.name} </span>
              and all its stages.
            </p>
          </div>

          <div className='border rounded-md p-4 bg-slate-50'>
            <h3 className='font-semibold'>Workflow Information</h3>
            <div className='mt-2 space-y-1 text-sm'>
              <p>
                <span className='text-muted-foreground'>Name:</span>{' '}
                {workflow.name}
              </p>
              {workflow.description && (
                <p>
                  <span className='text-muted-foreground'>Description:</span>{' '}
                  {workflow.description}
                </p>
              )}
              <p>
                <span className='text-muted-foreground'>Stages:</span>{' '}
                {workflow.stages.length}
              </p>
            </div>
          </div>

          <WorkflowDeleteForm workflowId={workflow.id} />

          <div className='flex justify-end'>
            <Button variant='outline' asChild>
              <Link href={`/dashboard/settings/workflows/${workflow.id}`}>
                Cancel
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
