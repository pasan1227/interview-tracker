// app/(dashboard)/dashboard/settings/workflows/[id]/edit/page.tsx

import { notFound } from 'next/navigation';
import { requirePageRole } from '@/lib/authz';
import { PageHeader } from '@/components/dashboard/page-header';
import { getWorkflowById } from '@/data/workflow';
import { WorkflowForm } from '@/components/workflows/workflow-form';
import { UserRole } from '@/lib/generated/prisma/browser';

interface EditWorkflowPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditWorkflowPage({
  params,
}: EditWorkflowPageProps) {
  await requirePageRole(UserRole.ADMIN);
  const { id: workflowId } = await params;

  const workflow = await getWorkflowById(workflowId);

  if (!workflow) {
    notFound();
  }

  return (
    <div className='mx-auto flex max-w-[1200px] flex-col gap-6'>
      <PageHeader
        eyebrow='Edit'
        title='Edit workflow'
        description='Update the interview workflow details.'
      />

      <div className='rounded-xl border border-border bg-card p-6'>
        <WorkflowForm workflow={workflow} isEdit />
      </div>
    </div>
  );
}
