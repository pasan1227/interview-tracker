'use client';

import { deleteCandidate } from '@/actions/candidate';
import { DeleteConfirmForm } from '@/components/ui/delete-confirm-form';

interface CandidateDeleteFormProps {
  candidateId: string;
}

export function CandidateDeleteForm({ candidateId }: CandidateDeleteFormProps) {
  return (
    <DeleteConfirmForm
      onDelete={() => deleteCandidate(candidateId)}
      redirectTo='/candidates'
      buttonLabel='Delete permanently'
      errorLabel='candidate'
    />
  );
}
