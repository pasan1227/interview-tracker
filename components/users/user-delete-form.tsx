'use client';

import { deleteUser } from '@/actions/user';
import { DeleteConfirmForm } from '@/components/ui/delete-confirm-form';

interface UserDeleteFormProps {
  userId: string;
}

export function UserDeleteForm({ userId }: UserDeleteFormProps) {
  return (
    <DeleteConfirmForm
      onDelete={() => deleteUser(userId)}
      redirectTo='/dashboard/settings/users'
      buttonLabel='Delete user'
      errorLabel='user'
    />
  );
}
