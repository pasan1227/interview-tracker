import { notFound } from 'next/navigation';
import { requirePageRole } from '@/lib/authz';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { StageForm } from '@/components/workflows/stage-form';
import { UserRole } from '@/lib/generated/prisma/browser';

interface EditStagePageProps {
  params: Promise<{ id: string; stageId: string }>;
}

export default async function EditStagePage({ params }: EditStagePageProps) {
  const session = await auth();
  const { id: workflowId, stageId } = await params;

  await requirePageRole(UserRole.ADMIN);

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

      <div className='rounded-xl border border-border bg-card p-6'>
        <StageForm stage={stage} workflowId={workflowId} isEdit />
      </div>
    </div>
  );
}
