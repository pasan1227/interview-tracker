// app/(dashboard)/dashboard/settings/workflows/new/page.tsx

import { WorkflowForm } from '@/components/workflows/workflow-form';
import { requirePageRole } from '@/lib/authz';
import { UserRole } from '@/lib/generated/prisma/browser';

export default async function NewWorkflowPage() {
  await requirePageRole(UserRole.ADMIN);

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Create New Workflow</h1>
        <p className='text-muted-foreground'>
          Define a new interview process with customized stages
        </p>
      </div>

      <div className='rounded-xl border border-border bg-card p-6'>
        <WorkflowForm />
      </div>
    </div>
  );
}
