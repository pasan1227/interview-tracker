// components/positions/position-form.tsx (updated)

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  PositionInputSchema,
  type PositionInput,
} from '@/lib/validations/dashboard';
import { Position, Workflow } from '@/lib/generated/prisma/browser';
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
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createPosition, updatePosition } from '@/actions/position';
import { ReloadIcon } from '@radix-ui/react-icons';

type PositionFormValues = PositionInput;

interface PositionFormProps {
  position?: Position | null;
  workflows: Workflow[];
  isEdit?: boolean;
}

export function PositionForm({
  position,
  workflows,
  isEdit = false,
}: PositionFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Find default workflow
  const defaultWorkflow = workflows.find((w) => w.isDefault);

  // Default values for the form
  const defaultValues: Partial<PositionFormValues> = {
    title: position?.title || '',
    department: position?.department || '',
    workflowId: position?.workflowId || defaultWorkflow?.id || '',
    isActive: position?.isActive ?? true,
  };

  const form = useForm<PositionFormValues>({
    resolver: zodResolver(PositionInputSchema),
    defaultValues,
  });

  // Update the workflowId field when the default workflow is loaded
  useEffect(() => {
    if (!position?.workflowId && defaultWorkflow && !isEdit) {
      form.setValue('workflowId', defaultWorkflow.id);
    }
  }, [defaultWorkflow, form, position?.workflowId, isEdit]);

  async function onSubmit(values: PositionFormValues) {
    setIsSubmitting(true);
    setError(null);

    try {
      if (isEdit && position) {
        // Update existing position
        await updatePosition(position.id, values);
        router.push(`/dashboard/positions`);
        router.refresh();
      } else {
        // Create new position
        await createPosition(values);
        router.push(`/dashboard/positions`);
        router.refresh();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setError('Failed to save position. Please try again.');
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
          name='title'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder='Software Engineer' {...field} />
              </FormControl>
              <FormDescription>The title of the position</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='department'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Department</FormLabel>
              <FormControl>
                <Input
                  placeholder='Engineering'
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                The department this position belongs to
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='workflowId'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Interview Workflow</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Select a workflow' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value='None'>None</SelectItem>
                  {workflows.map((workflow) => (
                    <SelectItem key={workflow.id} value={workflow.id}>
                      {workflow.name} {workflow.isDefault ? '(Default)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                The interview process for this position
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='isActive'
          render={({ field }) => (
            <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
              <div className='space-y-0.5'>
                <FormLabel className='text-base'>Active</FormLabel>
                <FormDescription>
                  Is this position currently active and open for candidates?
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
            {isEdit ? 'Update Position' : 'Create Position'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
