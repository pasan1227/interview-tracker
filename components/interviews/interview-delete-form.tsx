// components/interviews/interview-delete-form.tsx

'use client';

import { deleteInterview } from '@/actions/interview';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ReloadIcon } from '@radix-ui/react-icons';
import { TrashIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface InterviewDeleteFormProps {
  interviewId: string;
}

export function InterviewDeleteForm({
  interviewId,
}: InterviewDeleteFormProps) {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();

    if (confirmation !== 'delete') {
      setError("Please type 'delete' to confirm");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await deleteInterview(interviewId);
      router.push('/dashboard/interviews');
      router.refresh();
    } catch (error) {
      console.error('Failed to delete interview:', error);
      setError('Failed to delete interview. Please try again.');
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleDelete} className='space-y-4'>
      {error && (
        <Alert variant='destructive'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className='space-y-2'>
        <p className='text-sm'>
          Please type <span className='font-mono'>delete</span> to confirm:
        </p>
        <Input
          type='text'
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          disabled={isSubmitting}
          placeholder='delete'
          className='max-w-xs'
        />
      </div>

      <Button
        type='submit'
        variant='destructive'
        disabled={confirmation !== 'delete' || isSubmitting}
      >
        {isSubmitting ? (
          <ReloadIcon className='mr-2 h-4 w-4 animate-spin' />
        ) : (
          <TrashIcon className='mr-2 h-4 w-4' />
        )}
        Delete Interview
      </Button>
    </form>
  );
}
