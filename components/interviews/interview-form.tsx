'use client';

import { createInterview, updateInterview } from '@/actions/interview';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { DateTimeField } from '@/components/ui/date-time-field';
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
import { MultiSelect } from '@/components/ui/multi-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Interview,
  InterviewStatus,
  InterviewType,
  User,
} from '@/lib/generated/prisma/browser';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreateInterviewSchema,
  type CreateInterviewInput,
} from '@/lib/validations/dashboard';
import { ReloadIcon } from '@radix-ui/react-icons';
import { addHours, setHours, setMinutes } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { useFormAction } from '@/hooks/use-form-action';
import { useForm } from 'react-hook-form';
import type { InterviewFormStage } from '@/data/interview-form';

type InterviewFormValues = CreateInterviewInput;

// Prop types here match what data/interview.ts:getInterviewForForm and
// data/interview-form.ts:getInterviewFormOptions actually return — namely
// SAFE_USER_SELECT shape (no password) and `name: string | null` because
// User.name is nullable in the schema. The previous tighter shape
// required three @ts-expect-error suppressions on the consuming pages.
interface InterviewFormProps {
  interview?:
    | (Interview & {
        interviewers: Pick<User, 'id' | 'name' | 'email' | 'image' | 'role'>[];
      })
    | null;
  defaultCandidateId?: string;
  candidates: { id: string; name: string; positionId?: string | null }[];
  positions: { id: string; title: string }[];
  interviewers: { id: string; name: string | null; email: string }[];
  // Map of positionId → workflow stages, pre-computed server-side by
  // getInterviewFormOptions. Replaces the per-position-change roundtrip
  // that useStagesForPosition used to do.
  stagesByPosition: Record<string, InterviewFormStage[]>;
  isEdit?: boolean;
  // When false, the form disables scheduling/assignment inputs because
  // updateInterview will strip them on submit (privilege ceiling for
  // plain interviewers). Defaults to true so create flows and the
  // schedule-from-candidate shortcut are unaffected.
  canEditScheduling?: boolean;
}

export function InterviewForm({
  interview,
  defaultCandidateId,
  candidates,
  positions,
  interviewers,
  stagesByPosition,
  isEdit = false,
  canEditScheduling = true,
}: InterviewFormProps) {
  const router = useRouter();

  const form = useForm<InterviewFormValues>({
    resolver: zodResolver(CreateInterviewSchema),
    defaultValues: buildDefaults(interview, defaultCandidateId),
  });

  const positionId = form.watch('positionId');
  const candidateId = form.watch('candidateId');
  // Synchronous lookup against the pre-fetched map. Position dropdown
  // becomes responsive — no spinner on the stage select while a server
  // action completes.
  const stages = useMemo<InterviewFormStage[]>(
    () => (positionId ? stagesByPosition[positionId] ?? [] : []),
    [positionId, stagesByPosition]
  );
  const isLoadingStages = false;

  // When the candidate is changed on a new interview, auto-fill the position
  // from the candidate's current position if the user hasn't already chosen
  // one. Note: relies on `candidates` items carrying a `positionId` field at
  // runtime even though the prop type doesn't include it — see the page that
  // builds this prop.
  useEffect(() => {
    if (isEdit || !candidateId || form.getValues('positionId')) return;
    const candidate = candidates.find((c) => c.id === candidateId) as
      | { id: string; name: string; positionId?: string }
      | undefined;
    if (candidate?.positionId) {
      form.setValue('positionId', candidate.positionId);
    }
  }, [candidateId, candidates, form, isEdit]);

  const { submit, isSubmitting, error } = useFormAction(
    async (values: InterviewFormValues) => {
      if (isEdit && interview) {
        await updateInterview(interview.id, values);
        return { id: interview.id };
      }
      return await createInterview(values);
    },
    {
      errorMessage: 'Failed to save interview. Please try again.',
      onSuccess: ({ id }) => {
        router.push(`/dashboard/interviews/${id}`);
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

        {!canEditScheduling && (
          <Alert>
            <AlertDescription>
              You can update notes and status. Scheduling, assignment, and
              candidate/position changes are reserved for managers.
            </AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name='title'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Interview Title</FormLabel>
              <FormControl>
                <Input
                  placeholder='Technical Interview'
                  disabled={!canEditScheduling}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                A descriptive title for the interview
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='grid gap-6 md:grid-cols-2'>
          <FormField
            control={form.control}
            name='candidateId'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Candidate</FormLabel>
                <Select
                  disabled={isEdit || !!defaultCandidateId || !canEditScheduling}
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Select a candidate' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {candidates.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
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
            name='positionId'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Position</FormLabel>
                <Select
                  disabled={!canEditScheduling}
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Select a position' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {positions.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
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
            name='type'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Interview Type</FormLabel>
                <Select
                  disabled={!canEditScheduling}
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Select a type' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(InterviewType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace(/_/g, ' ')}
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
            name='stageId'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Interview Stage</FormLabel>
                <Select
                  disabled={
                    isLoadingStages || stages.length === 0 || !canEditScheduling
                  }
                  onValueChange={field.onChange}
                  value={field.value || undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={stagePlaceholder(isLoadingStages, stages.length)} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value='None'>None</SelectItem>
                    {stages.map((stage) => (
                      <SelectItem key={stage.id} value={stage.id}>
                        Stage {stage.order + 1}: {stage.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  The stage of the interview process
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <DateTimeField
            control={form.control}
            name='startTime'
            label='Start Date & Time'
            disabled={!canEditScheduling}
          />
          <DateTimeField
            control={form.control}
            name='endTime'
            label='End Date & Time'
            disabled={!canEditScheduling}
          />
        </div>

        <FormField
          control={form.control}
          name='location'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input
                  placeholder='Conference Room A or https://meet.google.com/...'
                  disabled={!canEditScheduling}
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                Physical location or video call link
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='interviewerIds'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Interviewers</FormLabel>
              <FormControl>
                <MultiSelect
                  options={interviewers.map((i) => ({
                    value: i.id,
                    label: i.name ?? i.email,
                  }))}
                  selected={field.value}
                  onChange={field.onChange}
                  placeholder='Select interviewers'
                  disabled={!canEditScheduling}
                />
              </FormControl>
              <FormDescription>Select one or more interviewers</FormDescription>
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
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Select a status' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(InterviewStatus).map((status) => (
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
          name='notes'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder='Additional details or instructions for interviewers'
                  className='min-h-32'
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                Any special instructions or points to cover
              </FormDescription>
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
            {isEdit ? 'Update interview' : 'Schedule interview'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function buildDefaults(
  interview: InterviewFormProps['interview'],
  defaultCandidateId?: string
): Partial<InterviewFormValues> {
  // Default start: top of the next half-hour, one hour from now.
  const now = new Date();
  const defaultStart = setMinutes(
    setHours(new Date(), now.getHours() + 1),
    Math.ceil(now.getMinutes() / 30) * 30
  );
  const defaultEnd = addHours(defaultStart, 1);
  return {
    title: interview?.title || '',
    startTime: interview?.startTime ? new Date(interview.startTime) : defaultStart,
    endTime: interview?.endTime ? new Date(interview.endTime) : defaultEnd,
    location: interview?.location || '',
    notes: interview?.notes || '',
    type: interview?.type || InterviewType.TECHNICAL,
    status: interview?.status || InterviewStatus.SCHEDULED,
    candidateId: interview?.candidateId || defaultCandidateId || '',
    positionId: interview?.positionId || '',
    stageId: interview?.stageId || '',
    interviewerIds: interview?.interviewers.map((i) => i.id) || [],
  };
}

function stagePlaceholder(isLoading: boolean, count: number) {
  if (isLoading) return 'Loading stages...';
  if (count === 0) return 'No stages available';
  return 'Select a stage';
}
