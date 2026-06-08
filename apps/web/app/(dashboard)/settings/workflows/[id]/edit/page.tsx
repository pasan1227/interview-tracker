// app/(dashboard)/settings/workflows/[id]/edit/page.tsx

import { notFound } from 'next/navigation';
import { requirePageOrgRole, toOrgContext } from '@/lib/authz';
import { PageHeader } from '@/components/dashboard/page-header';
import { getWorkflowById } from '@/data/workflow';
import { WorkflowForm } from '@/components/workflows/workflow-form';
import { OrganizationRole } from '@/lib/generated/prisma/browser';

interface EditWorkflowPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditWorkflowPage({
  params,
}: EditWorkflowPageProps) {
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
