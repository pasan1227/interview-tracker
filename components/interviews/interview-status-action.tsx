'use client';

import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2Icon,
  XCircleIcon,
  AlertCircleIcon,
  ChevronDownIcon,
} from 'lucide-react';
import {
  markInterviewAsCompleted,
  markInterviewAsCanceled,
  markInterviewAsNoShow,
} from '@/actions/interview';
import { useRouter } from 'next/navigation';

interface InterviewStatusActionProps {
  interview: {
    id: string;
  };
}

export function InterviewStatusAction({
  interview,
}: InterviewStatusActionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleStatusChange = async (
    action: (formData: FormData) => Promise<{ success: boolean }>
  ) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('interviewId', interview.id);
      const result = await action(formData);

      if (result.success) {
        // Refresh the page to show updated status
        router.refresh();
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating interview status:', error);
      // You could add toast notification here
      alert('Failed to update interview status');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' disabled={isLoading}>
          {isLoading ? 'Updating...' : 'Update Status'}
          <ChevronDownIcon className='ml-2 h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem
          onClick={() => handleStatusChange(markInterviewAsCompleted)}
          className='cursor-pointer'
        >
          <CheckCircle2Icon className='mr-2 h-4 w-4 text-green-600' />
          Mark as Completed
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleStatusChange(markInterviewAsCanceled)}
          className='cursor-pointer'
        >
          <XCircleIcon className='mr-2 h-4 w-4 text-red-600' />
          Mark as Canceled
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleStatusChange(markInterviewAsNoShow)}
          className='cursor-pointer'
        >
          <AlertCircleIcon className='mr-2 h-4 w-4 text-yellow-600' />
          Mark as No-Show
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
