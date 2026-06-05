// app/(dashboard)/dashboard/settings/workflows/[id]/edit/page.tsx

import { notFound } from 'next/navigation';
import { requirePageRole } from '@/lib/authz';
import { auth } from '@/auth';
import { getWorkflowById } from '@/data/workflow';
import { WorkflowForm } from '@/components/workflows/workflow-form';
import { UserRole } from '@/lib/generated/prisma/browser';

interface EditWorkflowPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditWorkflowPage({
  params,
}: EditWorkflowPageProps) {
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
        <h1 className='text-3xl font-bold'>Edit Workflow</h1>
        <p className='text-muted-foreground'>
          Update the interview workflow details
        </p>
      </div>

      <div className='rounded-xl border border-border bg-card p-6'>
        <WorkflowForm workflow={workflow} isEdit />
      </div>
    </div>
  );
}
