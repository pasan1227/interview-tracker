// app/(dashboard)/dashboard/settings/workflows/new/page.tsx

import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { WorkflowForm } from '@/components/workflows/workflow-form';
import { UserRole } from '@/lib/generated/prisma/browser';

export default async function NewWorkflowPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect('/login');
  }

  // Check if user has permission to access this page
  if (session.user.role !== UserRole.ADMIN) {
    redirect('/dashboard');
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Create New Workflow</h1>
        <p className='text-muted-foreground'>
          Define a new interview process with customized stages
        </p>
      </div>

      <div className='rounded-md border p-6 bg-white'>
        <WorkflowForm />
      </div>
    </div>
  );
}
