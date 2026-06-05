'use client';

import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle2Icon,
  XCircleIcon,
  AlertCircleIcon,
  ChevronDownIcon,
} from 'lucide-react';
import { updateInterviewStatus } from '@/actions/interview';
import { InterviewStatus } from '@/lib/generated/prisma/browser';
import { useRouter } from 'next/navigation';
import { useFormAction } from '@/hooks/use-form-action';

interface InterviewStatusActionProps {
  interview: {
    id: string;
  };
}

export function InterviewStatusAction({
  interview,
}: InterviewStatusActionProps) {
  const router = useRouter();
  // Local "which status are we transitioning to" so the action call is
  // a single inline submit. useFormAction owns isSubmitting + error.
  const [pendingStatus, setPendingStatus] = useState<InterviewStatus | null>(
    null
  );

  const { submit, isSubmitting, error } = useFormAction(
    async (status: InterviewStatus) => {
      await updateInterviewStatus(interview.id, status);
    },
    {
      errorMessage: 'Failed to update interview status.',
      onSuccess: () => router.refresh(),
    }
  );

  const trigger = (status: InterviewStatus) => async () => {
    setPendingStatus(status);
    await submit(status);
    setPendingStatus(null);
  };

  return (
    <div className='flex flex-col items-end gap-2'>
      {error && (
        <Alert variant='destructive' className='w-72'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='outline' disabled={isSubmitting}>
            {isSubmitting ? 'Updating…' : 'Update status'}
            <ChevronDownIcon className='ml-2 h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuItem
            onClick={trigger(InterviewStatus.COMPLETED)}
            className='cursor-pointer'
            disabled={isSubmitting && pendingStatus !== InterviewStatus.COMPLETED}
          >
            <CheckCircle2Icon
              className='mr-2 h-4 w-4'
              style={{ color: 'var(--badge-success-fg)' }}
            />
            Mark as Completed
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={trigger(InterviewStatus.CANCELED)}
            className='cursor-pointer'
            disabled={isSubmitting && pendingStatus !== InterviewStatus.CANCELED}
          >
            <XCircleIcon
              className='mr-2 h-4 w-4'
              style={{ color: 'var(--badge-danger-fg)' }}
            />
            Mark as Canceled
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={trigger(InterviewStatus.NO_SHOW)}
            className='cursor-pointer'
            disabled={isSubmitting && pendingStatus !== InterviewStatus.NO_SHOW}
          >
            <AlertCircleIcon
              className='mr-2 h-4 w-4'
              style={{ color: 'var(--badge-warning-fg)' }}
            />
            Mark as No-Show
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
