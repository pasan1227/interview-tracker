import { notFound } from 'next/navigation';
import { requirePageRole } from '@/lib/authz';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusIcon, ArrowLeftIcon } from 'lucide-react';
import { WorkflowHeader } from '@/components/workflows/workflow-header';
import { WorkflowStages } from '@/components/workflows/workflow-stages-lazy';
import { getWorkflowById } from '@/data/workflow';
import { UserRole } from '@/lib/generated/prisma/browser';

interface WorkflowPageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkflowPage({ params }: WorkflowPageProps) {
  await requirePageRole(UserRole.ADMIN);
  const { id: workflowId } = await params;

  const workflow = await getWorkflowById(workflowId);

  if (!workflow) {
    notFound();
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center'>
        <Button variant='outline' size='sm' className='mr-4' asChild>
          <Link href='/dashboard/settings/workflows'>
            <ArrowLeftIcon className='mr-2 h-4 w-4' />
            Back to Workflows
          </Link>
        </Button>
        <h1 className='text-3xl font-bold'>{workflow.name}</h1>
      </div>

      <WorkflowHeader workflow={workflow} />

      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-xl font-semibold'>Interview Stages</h2>
          <Button size='sm' asChild>
            <Link
              href={`/dashboard/settings/workflows/${workflow.id}/stages/new`}
            >
              <PlusIcon className='mr-2 h-4 w-4' />
              Add Stage
            </Link>
          </Button>
        </div>

        <WorkflowStages workflow={workflow} />
      </div>
    </div>
  );
}
