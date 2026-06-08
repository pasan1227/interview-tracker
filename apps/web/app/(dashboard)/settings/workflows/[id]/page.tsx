import { notFound } from 'next/navigation';
import { requirePageOrgRole, toOrgContext } from '@/lib/authz';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusIcon, ArrowLeftIcon } from 'lucide-react';
import { WorkflowHeader } from '@/components/workflows/workflow-header';
import { WorkflowStages } from '@/components/workflows/workflow-stages-lazy';
import { getWorkflowById } from '@/data/workflow';
import { OrganizationRole } from '@/lib/generated/prisma/browser';

interface WorkflowPageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkflowPage({ params }: WorkflowPageProps) {
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
        eyebrow='Workflow'
        title={workflow.name}
        description={workflow.description || 'Configure interview stages for this workflow.'}
        action={
          <Button variant='outline' size='sm' asChild>
            <Link href='/settings/workflows'>
              <ArrowLeftIcon className='mr-2 h-4 w-4' />
              Back to workflows
            </Link>
          </Button>
        }
      />

      <WorkflowHeader workflow={workflow} />

      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-xl font-semibold'>Interview stages</h2>
          <Button size='sm' asChild>
            <Link
              href={`/settings/workflows/${workflow.id}/stages/new`}
            >
              <PlusIcon className='mr-2 h-4 w-4' />
              Add stage
            </Link>
          </Button>
        </div>

        <WorkflowStages workflow={workflow} />
      </div>
    </div>
  );
}
