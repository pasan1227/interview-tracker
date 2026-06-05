'use client';

import { deleteInterview } from '@/actions/interview';
import { DeleteConfirmForm } from '@/components/ui/delete-confirm-form';

interface InterviewDeleteFormProps {
  interviewId: string;
}

export function InterviewDeleteForm({ interviewId }: InterviewDeleteFormProps) {
  return (
    <DeleteConfirmForm
      onDelete={() => deleteInterview(interviewId)}
      redirectTo='/dashboard/interviews'
      buttonLabel='Delete Interview'
      errorLabel='interview'
    />
  );
}
