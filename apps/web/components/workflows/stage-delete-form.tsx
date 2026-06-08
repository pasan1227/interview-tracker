'use client';

import { deleteStage } from '@/actions/workflow';
import { DeleteConfirmForm } from '@/components/ui/delete-confirm-form';

interface StageDeleteFormProps {
  stageId: string;
  workflowId: string;
}

export function StageDeleteForm({ stageId, workflowId }: StageDeleteFormProps) {
  return (
    <DeleteConfirmForm
      onDelete={() => deleteStage(stageId, workflowId)}
      redirectTo={`/settings/workflows/${workflowId}`}
      buttonLabel='Delete stage'
      errorLabel='stage'
    />
  );
}
