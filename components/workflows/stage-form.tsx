// components/workflows/stage-form.tsx (continued)

'use client';

import { useFormAction } from '@/hooks/use-form-action';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  StageInputSchema,
  type StageInput,
} from '@/lib/validations/dashboard';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createStage, updateStage } from '@/actions/workflow';
import { ReloadIcon } from '@radix-ui/react-icons';
import { Stage } from '@/lib/generated/prisma/browser';

type StageFormValues = StageInput;

interface StageFormProps {
  stage?: Stage | null;
  workflowId: string;
  isEdit?: boolean;
}

export function StageForm({
  stage,
  workflowId,
  isEdit = false,
}: StageFormProps) {
  const router = useRouter();

  // Default values for the form
  const defaultValues: Partial<StageFormValues> = {
    name: stage?.name || '',
    description: stage?.description || '',
  };

  const form = useForm<StageFormValues>({
    resolver: zodResolver(StageInputSchema),
    defaultValues,
  });

  const { submit, isSubmitting, error } = useFormAction(
    async (values: StageFormValues) => {
      if (isEdit && stage) {
        await updateStage(stage.id, values);
      } else {
        await createStage(workflowId, values);
      }
    },
    {
      errorMessage: 'Failed to save stage. Please try again.',
      onSuccess: () => {
        router.push(`/dashboard/settings/workflows/${workflowId}`);
        router.refresh();
      },
    }
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className='space-y-6'>
        {error && (
          <Alert variant='destructive'>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stage Name</FormLabel>
              <FormControl>
                <Input placeholder='Technical Interview' {...field} />
              </FormControl>
              <FormDescription>
                The name of this interview stage
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='description'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder='Describe the purpose and details of this stage'
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                Additional information about this stage
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='flex items-center justify-end space-x-4'>
          <Button
            type='button'
            variant='outline'
            onClick={() =>
              router.push(`/dashboard/settings/workflows/${workflowId}`)
            }
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type='submit' disabled={isSubmitting}>
            {isSubmitting && (
              <ReloadIcon className='mr-2 h-4 w-4 animate-spin' />
            )}
            {isEdit ? 'Update Stage' : 'Add Stage'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
