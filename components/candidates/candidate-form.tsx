// components/candidates/candidate-form.tsx

'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFormAction } from '@/hooks/use-form-action';
import {
  CreateCandidateSchema,
  type CreateCandidateInput,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { createCandidate, updateCandidate } from '@/actions/candidate';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ReloadIcon } from '@radix-ui/react-icons';
import { Candidate, CandidateStatus } from '@/lib/generated/prisma/browser';

// Form uses the same schema the server action validates against, so a
// field added or tightened on the server picks up here automatically.
type CandidateFormValues = CreateCandidateInput;

interface CandidateFormProps {
  candidate?: Candidate | null;
  positions: { id: string; title: string }[];
  isEdit?: boolean;
}

export function CandidateForm({
  candidate,
  positions,
  isEdit = false,
}: CandidateFormProps) {
  const router = useRouter();

  // Default values for the form
  const defaultValues: Partial<CandidateFormValues> = {
    name: candidate?.name || '',
    email: candidate?.email || '',
    phone: candidate?.phone || '',
    status: candidate?.status || CandidateStatus.NEW,
    positionId: candidate?.positionId || '',
    source: candidate?.source || '',
    resumeUrl: candidate?.resumeUrl || '',
    notes: '',
  };

  const form = useForm<CandidateFormValues>({
    resolver: zodResolver(CreateCandidateSchema),
    defaultValues,
    mode: 'onBlur',
  });

  const { submit, isSubmitting, error } = useFormAction(
    async (values: CandidateFormValues) => {
      if (isEdit && candidate) {
        await updateCandidate(candidate.id, values);
        return { id: candidate.id };
      }
      return await createCandidate(values);
    },
    {
      errorMessage: 'Failed to save candidate. Please try again.',
      onSuccess: ({ id }) => {
        router.push(`/dashboard/candidates/${id}`);
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

        <div className='grid gap-6 md:grid-cols-2'>
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder='John Doe' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='email'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type='email'
                    placeholder='john@example.com'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='phone'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input
                    placeholder='+1 (555) 123-4567'
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='positionId'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Position</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value ?? undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Select a position' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value='None'>None</SelectItem>
                    {positions.map((position) => (
                      <SelectItem key={position.id} value={position.id}>
                        {position.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='status'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Select a status' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(CandidateStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='source'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Source</FormLabel>
                <FormControl>
                  <Input
                    placeholder='LinkedIn, Referral, etc.'
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='resumeUrl'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Resume URL</FormLabel>
                <FormControl>
                  <Input
                    placeholder='https://example.com/resume.pdf'
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormDescription>
                  Link to the candidate&apos;s resume
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name='notes'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder='Add any additional notes about the candidate'
                  className='min-h-32'
                  {...field}
                />
              </FormControl>
              <FormMessage />
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
            {isEdit ? 'Update candidate' : 'Add candidate'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
