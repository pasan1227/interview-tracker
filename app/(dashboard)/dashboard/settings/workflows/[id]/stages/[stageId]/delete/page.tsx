// app/(dashboard)/dashboard/settings/workflows/[workflowId]/stages/[stageId]/delete/page.tsx

import { notFound } from 'next/navigation';
import { requirePageRole } from '@/lib/authz';
import { db } from '@/lib/db';
import { DeleteResourcePage } from '@/components/dashboard/delete-resource-page';
import { StageDeleteForm } from '@/components/workflows/stage-delete-form';
import { UserRole } from '@/lib/generated/prisma/browser';

interface DeleteStagePageProps {
  params: Promise<{ id: string; stageId: string }>;
}

export default async function DeleteStagePageRoute({
  params,
}: DeleteStagePageProps) {
  await requirePageRole(UserRole.ADMIN);
  const { id: workflowId, stageId } = await params;

  const stage = await db.stage.findUnique({
    where: { id: stageId, workflowId },
    include: { workflow: true },
  });
  if (!stage) notFound();

  return (
    <DeleteResourcePage
      title='Delete stage'
      description='Are you sure you want to delete this interview stage?'
      resourceLabel='stage'
      resourceName={`${stage.name} (workflow "${stage.workflow.name}")`}
      detailsHeading='Stage information'
      details={[
        { label: 'Name', value: stage.name },
        { label: 'Description', value: stage.description },
        { label: 'Order', value: stage.order + 1 },
      ]}
      cancelHref={`/dashboard/settings/workflows/${workflowId}`}
    >
      <StageDeleteForm stageId={stageId} workflowId={workflowId} />
    </DeleteResourcePage>
  );
}
