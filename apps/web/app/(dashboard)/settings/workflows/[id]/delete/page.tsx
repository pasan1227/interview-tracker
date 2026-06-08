import { redirect, notFound } from 'next/navigation';
import { requirePageOrgRole, toOrgContext } from '@/lib/authz';
import { getWorkflowById } from '@/data/workflow';
import { DeleteResourcePage } from '@/components/dashboard/delete-resource-page';
import { WorkflowDeleteForm } from '@/components/workflows/workflow-delete-form';
import { OrganizationRole } from '@/lib/generated/prisma/browser';

interface DeleteWorkflowPageProps {
  params: Promise<{ id: string }>;
}

export default async function DeleteWorkflowPageRoute({
  params,
}: DeleteWorkflowPageProps) {
  const user = await requirePageOrgRole([
    OrganizationRole.OWNER,
    OrganizationRole.ADMIN,
  ]);
  const { id: workflowId } = await params;

  const workflow = await getWorkflowById(toOrgContext(user), workflowId);
  if (!workflow) notFound();

  // Default workflow can't be deleted.
  if (workflow.isDefault) {
    redirect(`/settings/workflows/${workflow.id}`);
  }

  return (
    <DeleteResourcePage
      title='Delete workflow'
      description='Are you sure you want to delete this workflow?'
      resourceLabel='workflow'
      resourceName={workflow.name}
      detailsHeading='Workflow information'
      details={[
        { label: 'Name', value: workflow.name },
        { label: 'Description', value: workflow.description },
        { label: 'Stages', value: workflow.stages.length },
      ]}
      impact={[{ label: 'stages', count: workflow.stages.length }]}
      cancelHref={`/settings/workflows/${workflow.id}`}
    >
      <WorkflowDeleteForm workflowId={workflow.id} />
    </DeleteResourcePage>
  );
}
