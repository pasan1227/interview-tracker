// app/(dashboard)/dashboard/settings/workflows/[workflowId]/stages/[stageId]/edit/page.tsx

import { redirect, notFound } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { StageForm } from '@/components/workflows/stage-form';
import { UserRole } from '@/lib/generated/prisma/browser';

interface EditStagePageProps {
  params: Promise<{
    workflowId: string;
    stageId: string;
  }>;
}

export default async function EditStagePage({ params }: EditStagePageProps) {
  const session = await auth();
  const { workflowId, stageId } = await params;

  if (!session || !session.user) {
    redirect('/login');
  }

  // Check if user has permission to access this page
  if (session.user.role !== UserRole.ADMIN) {
    redirect('/dashboard');
  }

  // Get the workflow and stage
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
        <h1 className='text-3xl font-bold'>Edit Stage</h1>
        <p className='text-muted-foreground'>
          Update the stage details for the &ldquo;{stage.workflow.name}&rdquo; workflow
        </p>
      </div>

      <div className='rounded-md border p-6 bg-white'>
        <StageForm stage={stage} workflowId={workflowId} isEdit />
      </div>
    </div>
  );
}
