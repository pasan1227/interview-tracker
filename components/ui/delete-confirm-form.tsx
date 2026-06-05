'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ReloadIcon } from '@radix-ui/react-icons';
import { TrashIcon } from 'lucide-react';
import { useFormAction } from '@/hooks/use-form-action';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const CONFIRM_WORD = 'delete';

interface DeleteConfirmFormProps {
  /** Server-action call that performs the delete. */
  onDelete: () => Promise<unknown>;
  /** Where to send the user after a successful delete. */
  redirectTo: string;
  /** Button label, e.g. "Delete Position" or "Delete Permanently". */
  buttonLabel: string;
  /** Used only in the failure message ("Failed to delete {errorLabel}."). */
  errorLabel?: string;
}

export function DeleteConfirmForm({
  onDelete,
  redirectTo,
  buttonLabel,
  errorLabel = 'item',
}: DeleteConfirmFormProps) {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState('');

  const { submit, isSubmitting, error, setError } = useFormAction(
    async () => {
      await onDelete();
    },
    {
      errorMessage: `Failed to delete ${errorLabel}. Please try again.`,
      onSuccess: () => {
        router.push(redirectTo);
        router.refresh();
      },
    }
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (confirmation !== CONFIRM_WORD) {
      setError(`Please type '${CONFIRM_WORD}' to confirm`);
      return;
    }
    await submit(undefined);
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      {error && (
        <Alert variant='destructive'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className='space-y-2'>
        <p className='text-sm'>
          Please type <span className='font-mono'>{CONFIRM_WORD}</span> to confirm:
        </p>
        <Input
          type='text'
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          disabled={isSubmitting}
          placeholder={CONFIRM_WORD}
          className='max-w-xs'
        />
      </div>

      <Button
        type='submit'
        variant='destructive'
        disabled={confirmation !== CONFIRM_WORD || isSubmitting}
      >
        {isSubmitting ? (
          <ReloadIcon className='mr-2 h-4 w-4 animate-spin' />
        ) : (
          <TrashIcon className='mr-2 h-4 w-4' />
        )}
        {buttonLabel}
      </Button>
    </form>
  );
}
