// components/candidates/candidate-status-update.tsx

'use client';

import { updateCandidateStatus } from '@/actions/candidate';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFormAction } from '@/hooks/use-form-action';
import { Candidate, CandidateStatus } from '@/lib/generated/prisma/browser';
import { ReloadIcon } from '@radix-ui/react-icons';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface CandidateStatusUpdateProps {
  candidate: Candidate;
}

export function CandidateStatusUpdate({
  candidate,
}: CandidateStatusUpdateProps) {
  const router = useRouter();
  const [status, setStatus] = useState<string>(candidate.status);

  const { submit, isSubmitting, error } = useFormAction<string, void>(
    async (newStatus) => {
      await updateCandidateStatus(candidate.id, newStatus);
    },
    {
      onSuccess: () => router.refresh(),
      errorMessage: 'Failed to update candidate status.',
    }
  );

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === candidate.status || newStatus === status) return;
    setStatus(newStatus);
    await submit(newStatus);
  };

  // Revert the local state if the action threw — the hook surfaces the
  // failure via `error`; we just need to roll the optimistic update back.
  if (error && status !== candidate.status) {
    setStatus(candidate.status);
  }

  return (
    <div className='flex items-center gap-2'>
      <Select
        value={status}
        onValueChange={handleStatusChange}
        disabled={isSubmitting}
      >
        <SelectTrigger className='w-32'>
          <SelectValue placeholder='Status' />
        </SelectTrigger>
        <SelectContent>
          {Object.values(CandidateStatus).map((status) => (
            <SelectItem key={status} value={status}>
              {status.replace(/_/g, ' ')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isSubmitting && (
        <ReloadIcon className='h-4 w-4 animate-spin text-muted-foreground' />
      )}
    </div>
  );
}
