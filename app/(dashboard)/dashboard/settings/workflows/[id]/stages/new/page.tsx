// app/(dashboard)/dashboard/settings/workflows/[id]/stages/new/page.tsx

import { requirePageRole } from '@/lib/authz';
import { PageHeader } from '@/components/dashboard/page-header';
import { StageForm } from '@/components/workflows/stage-form';
import { getWorkflowById } from '@/data/workflow';
import { UserRole } from '@/lib/generated/prisma/browser';
import { notFound } from 'next/navigation';
interface NewStagePageProps {
  params: Promise<{ id: string }>;
}

export default async function NewStagePage({ params }: NewStagePageProps) {
  await requirePageRole(UserRole.ADMIN);
  const { id: workflowId } = await params;

  const workflow = await getWorkflowById(workflowId);

  if (!workflow) {
    notFound();
  }

  return (
    <div className='mx-auto flex max-w-[1200px] flex-col gap-6'>
      <PageHeader
        eyebrow='New'
        title='Add new stage'
        description={`Add a new interview stage to the "${workflow.name}" workflow.`}
      />

      <div className='rounded-xl border border-border bg-card p-6'>
        <StageForm workflowId={workflow.id} />
      </div>
    </div>
  );
}
