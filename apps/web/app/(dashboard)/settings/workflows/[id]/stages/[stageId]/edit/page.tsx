import { notFound } from 'next/navigation';
import { requirePageOrgRole } from '@/lib/authz';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/page-header';
import { StageForm } from '@/components/workflows/stage-form';
import { OrganizationRole } from '@/lib/generated/prisma/browser';

interface EditStagePageProps {
  params: Promise<{ id: string; stageId: string }>;
}

export default async function EditStagePage({ params }: EditStagePageProps) {
  await requirePageOrgRole([OrganizationRole.OWNER, OrganizationRole.ADMIN]);
  const { id: workflowId, stageId } = await params;

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
    <div className='mx-auto flex max-w-[1200px] flex-col gap-6'>
      <PageHeader
        eyebrow='Edit'
        title='Edit stage'
        description={`Update the stage details for the "${stage.workflow.name}" workflow.`}
      />

      <div className='rounded-xl border border-border bg-card p-6'>
        <StageForm stage={stage} workflowId={workflowId} isEdit />
      </div>
    </div>
  );
}
