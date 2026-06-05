'use client';

import { deletePosition } from '@/actions/position';
import { DeleteConfirmForm } from '@/components/ui/delete-confirm-form';

interface PositionDeleteFormProps {
  positionId: string;
}

export function PositionDeleteForm({ positionId }: PositionDeleteFormProps) {
  return (
    <DeleteConfirmForm
      onDelete={() => deletePosition(positionId)}
      redirectTo='/dashboard/positions'
      buttonLabel='Delete Position'
      errorLabel='position'
    />
  );
}
