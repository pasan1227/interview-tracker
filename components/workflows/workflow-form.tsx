// components/workflows/workflow-form.tsx

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
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createWorkflow, updateWorkflow } from '@/actions/workflow';
import { ReloadIcon } from '@radix-ui/react-icons';
import { Workflow } from '@/lib/generated/prisma/browser';

// Form schema
const workflowSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
  isDefault: z.boolean(),
});

type WorkflowFormValues = z.infer<typeof workflowSchema>;

interface WorkflowFormProps {
  workflow?: Workflow | null;
  isEdit?: boolean;
}

export function WorkflowForm({ workflow, isEdit = false }: WorkflowFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default values for the form
  const defaultValues: Partial<WorkflowFormValues> = {
    name: workflow?.name || '',
    description: workflow?.description || '',
    isDefault: workflow?.isDefault ?? false,
  };

  const form = useForm<WorkflowFormValues>({
    resolver: zodResolver(workflowSchema),
    defaultValues,
  });

  async function onSubmit(values: WorkflowFormValues) {
    setIsSubmitting(true);
    setError(null);

    try {
      if (isEdit && workflow) {
        // Update existing workflow
        await updateWorkflow(workflow.id, values);
        router.push(`/dashboard/settings/workflows/${workflow.id}`);
        router.refresh();
      } else {
        // Create new workflow
        const newWorkflow = await createWorkflow(values);
        router.push(`/dashboard/settings/workflows/${newWorkflow.id}`);
        router.refresh();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setError('Failed to save workflow. Please try again.');
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
              <FormLabel>Workflow Name</FormLabel>
              <FormControl>
                <Input
                  placeholder='Standard Engineering Interview'
                  {...field}
                />
              </FormControl>
              <FormDescription>
                A descriptive name for this interview workflow
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
                  placeholder='Describe the purpose and process of this workflow'
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                Optional details about how this workflow should be used
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='isDefault'
          render={({ field }) => (
            <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
              <div className='space-y-0.5'>
                <FormLabel className='text-base'>Default Workflow</FormLabel>
                <FormDescription>
                  Set this as the default workflow for new positions
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className='flex items-center justify-end space-x-4'>
          <Button
            type='button'
            variant='outline'
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type='submit' disabled={isSubmitting}>
            {isSubmitting && (
              <ReloadIcon className='mr-2 h-4 w-4 animate-spin' />
            )}
            {isEdit ? 'Update Workflow' : 'Create Workflow'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
