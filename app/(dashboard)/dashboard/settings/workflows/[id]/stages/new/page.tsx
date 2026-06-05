// app/(dashboard)/dashboard/settings/workflows/[id]/stages/new/page.tsx

import { auth } from '@/auth';
import { requirePageRole } from '@/lib/authz';
import { StageForm } from '@/components/workflows/stage-form';
import { getWorkflowById } from '@/data/workflow';
import { UserRole } from '@/lib/generated/prisma/browser';
import { notFound } from 'next/navigation';
interface NewStagePageProps {
  params: Promise<{ id: string }>;
}

export default async function NewStagePage({ params }: NewStagePageProps) {
  const session = await auth();
  const { id: workflowId } = await params;

  await requirePageRole(UserRole.ADMIN);

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

      <div className='rounded-xl border border-border bg-card p-6'>
        <StageForm workflowId={workflow.id} />
      </div>
    </div>
  );
}
