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
      redirectTo='/positions'
      buttonLabel='Delete position'
      errorLabel='position'
    />
  );
}
