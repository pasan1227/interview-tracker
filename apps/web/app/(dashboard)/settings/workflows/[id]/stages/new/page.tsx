// app/(dashboard)/settings/workflows/[id]/stages/new/page.tsx

import { requirePageOrgRole, toOrgContext } from '@/lib/authz';
import { PageHeader } from '@/components/page-header';
import { StageForm } from '@/components/workflows/stage-form';
import { getWorkflowById } from '@/data/workflow';
import { OrganizationRole } from '@/lib/generated/prisma/browser';
import { notFound } from 'next/navigation';
interface NewStagePageProps {
  params: Promise<{ id: string }>;
}

export default async function NewStagePage({ params }: NewStagePageProps) {
  const user = await requirePageOrgRole([
    OrganizationRole.OWNER,
    OrganizationRole.ADMIN,
  ]);
  const { id: workflowId } = await params;

  const workflow = await getWorkflowById(toOrgContext(user), workflowId);

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
