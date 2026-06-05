// app/(dashboard)/dashboard/settings/workflows/[id]/stages/new/page.tsx

import { auth } from '@/auth';
import { StageForm } from '@/components/workflows/stage-form';
import { getWorkflowById } from '@/data/workflow';
import { UserRole } from '@/lib/generated/prisma/browser';
import { notFound, redirect } from 'next/navigation';
interface NewStagePageProps {
  params: Promise<{
    workflowId: string;
  }>;
}

export default async function NewStagePage({ params }: NewStagePageProps) {
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

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Add New Stage</h1>
        <p className='text-muted-foreground'>
          Add a new interview stage to the &ldquo;{workflow.name}&rdquo;
          workflow
        </p>
      </div>

      <div className='rounded-md border p-6 bg-white'>
        <StageForm workflowId={workflow.id} />
      </div>
    </div>
  );
}
