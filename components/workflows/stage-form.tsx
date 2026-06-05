// components/workflows/stage-form.tsx (continued)

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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

// Form schema
const stageSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
});

type StageFormValues = z.infer<typeof stageSchema>;

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default values for the form
  const defaultValues: Partial<StageFormValues> = {
    name: stage?.name || '',
    description: stage?.description || '',
  };

  const form = useForm<StageFormValues>({
    resolver: zodResolver(stageSchema),
    defaultValues,
  });

  async function onSubmit(values: StageFormValues) {
    setIsSubmitting(true);
    setError(null);

    try {
      if (isEdit && stage) {
        await updateStage(stage.id, values);
      } else {
        await createStage(workflowId, values);
      }

      router.push(`/dashboard/settings/workflows/${workflowId}`);
      router.refresh();
    } catch (error) {
      console.error('Error submitting form:', error);
      setError('Failed to save stage. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
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
