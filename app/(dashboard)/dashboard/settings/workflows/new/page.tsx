// app/(dashboard)/dashboard/settings/workflows/new/page.tsx

import { PageHeader } from '@/components/dashboard/page-header';
import { WorkflowForm } from '@/components/workflows/workflow-form';
import { requirePageRole } from '@/lib/authz';
import { UserRole } from '@/lib/generated/prisma/browser';

export default async function NewWorkflowPage() {
  await requirePageRole(UserRole.ADMIN);

  return (
    <div className='mx-auto flex max-w-[1200px] flex-col gap-6'>
      <PageHeader
        eyebrow='New'
        title='Create new workflow'
        description='Define a new interview process with customized stages.'
      />

      <div className='rounded-xl border border-border bg-card p-6'>
        <WorkflowForm />
      </div>
    </div>
  );
}
