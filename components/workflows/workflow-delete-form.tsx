'use client';

import { deleteWorkflow } from '@/actions/workflow';
import { DeleteConfirmForm } from '@/components/ui/delete-confirm-form';

interface WorkflowDeleteFormProps {
  workflowId: string;
}

export function WorkflowDeleteForm({ workflowId }: WorkflowDeleteFormProps) {
  return (
    <DeleteConfirmForm
      onDelete={() => deleteWorkflow(workflowId)}
      redirectTo='/dashboard/settings/workflows'
      buttonLabel='Delete workflow'
      errorLabel='workflow'
    />
  );
}
