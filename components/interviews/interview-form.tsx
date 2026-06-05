// components/interviews/interview-form.tsx

'use client';

import { createInterview, updateInterview } from '@/actions/interview';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { ReloadIcon } from '@radix-ui/react-icons';
import { addHours, format, setHours, setMinutes } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Form schema
const interviewSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  startTime: z.date(),
  endTime: z.date(),
  location: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  type: z.nativeEnum(InterviewType),
  status: z.nativeEnum(InterviewStatus),
  candidateId: z.string().min(1, 'Candidate is required'),
  positionId: z.string().min(1, 'Position is required'),
  stageId: z.string().optional().nullable(),
  interviewerIds: z
    .array(z.string())
    .min(1, 'At least one interviewer is required'),
});

type InterviewFormValues = z.infer<typeof interviewSchema>;

interface InterviewFormProps {
  interview?:
    | (Interview & {
        interviewers: User[];
      })
    | null;
  defaultCandidateId?: string;
  candidates: { id: string; name: string }[];
  positions: { id: string; title: string }[];
  interviewers: { id: string; name: string; email: string }[];
  isEdit?: boolean;
}

export function InterviewForm({
  interview,
  defaultCandidateId,
  candidates,
  positions,
  interviewers,
  isEdit = false,
}: InterviewFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stages, setStages] = useState<
    { id: string; name: string; order: number }[]
  >([]);
  const [isLoadingStages, setIsLoadingStages] = useState(false);

  // Default start time (current hour + 1, rounded to next 30 min)
  const defaultStartTime = setMinutes(
    setHours(new Date(), new Date().getHours() + 1),
    Math.ceil(new Date().getMinutes() / 30) * 30
  );

  // Default end time (start time + 1 hour)
  const defaultEndTime = addHours(defaultStartTime, 1);

  // Default values for the form
  const defaultValues: Partial<InterviewFormValues> = {
    title: interview?.title || '',
    startTime: interview?.startTime
      ? new Date(interview.startTime)
      : defaultStartTime,
    endTime: interview?.endTime ? new Date(interview.endTime) : defaultEndTime,
    location: interview?.location || '',
    notes: interview?.notes || '',
    type: interview?.type || InterviewType.TECHNICAL,
    status: interview?.status || InterviewStatus.SCHEDULED,
    candidateId: interview?.candidateId || defaultCandidateId || '',
    positionId: interview?.positionId || '',
    stageId: interview?.stageId || '',
    interviewerIds: interview?.interviewers.map((i) => i.id) || [],
  };

  const form = useForm<InterviewFormValues>({
    resolver: zodResolver(interviewSchema),
    defaultValues,
  });

  // Watch for positionId changes to load stages
  const positionId = form.watch('positionId');

  // Fetch stages when position changes
  useEffect(() => {
    if (!positionId) {
      setStages([]);
      return;
    }

    async function fetchStages() {
      setIsLoadingStages(true);
      try {
        const response = await fetch(`/api/positions/${positionId}/stages`);

        if (response.ok) {
          const data = await response.json();
          setStages(data);
        }
      } catch (error) {
        console.error('Failed to fetch stages:', error);
      } finally {
        setIsLoadingStages(false);
      }
    }

    fetchStages();
  }, [positionId]);

  // Update position when candidate changes (if editing)
  const candidateId = form.watch('candidateId');

  useEffect(() => {
    if (isEdit || !candidateId || form.getValues('positionId')) {
      return;
    }

    // Find the candidate's position
    const candidate = candidates.find((c) => c.id === candidateId);
    //@ts-expect-error type mismatch

    if (candidate?.positionId) {
      //@ts-expect-error type mismatch
      form.setValue('positionId', candidate.positionId);
    }
  }, [candidateId, candidates, form, isEdit]);

  async function onSubmit(values: InterviewFormValues) {
    setIsSubmitting(true);
    setError(null);

    // Validate that end time is after start time
    if (values.endTime <= values.startTime) {
      setError('End time must be after start time');
      setIsSubmitting(false);
      return;
    }

    try {
      if (isEdit && interview) {
        // Update existing interview
        await updateInterview(interview.id, values);
        router.push(`/dashboard/interviews/${interview.id}`);
        router.refresh();
      } else {
        // Create new interview
        const newInterview = await createInterview(values);
        router.push(`/dashboard/interviews/${newInterview.id}`);
        router.refresh();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setError('Failed to save interview. Please try again.');
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
              <FormLabel>Interview Title</FormLabel>
              <FormControl>
                <Input placeholder='Technical Interview' {...field} />
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
                  disabled={isEdit || !!defaultCandidateId}
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Select a candidate' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {candidates.map((candidate) => (
                      <SelectItem key={candidate.id} value={candidate.id}>
                        {candidate.name}
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
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Select a position' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
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
            name='type'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Interview Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
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
                  disabled={isLoadingStages || stages.length === 0}
                  onValueChange={field.onChange}
                  value={field.value || undefined} // Use null instead of an empty string
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          isLoadingStages
                            ? 'Loading stages...'
                            : stages.length === 0
                              ? 'No stages available'
                              : 'Select a stage'
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={'None'}>None</SelectItem>{' '}
                    {/* Use null here */}
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

          <FormField
            control={form.control}
            name='startTime'
            render={({ field }) => (
              <FormItem className='flex flex-col'>
                <FormLabel>Start Date & Time</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant='outline'
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP p')
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className='w-auto p-0' align='start'>
                    <Calendar
                      mode='single'
                      selected={field.value}
                      onSelect={(date) => {
                        if (date) {
                          const newDate = new Date(field.value);
                          newDate.setFullYear(date.getFullYear());
                          newDate.setMonth(date.getMonth());
                          newDate.setDate(date.getDate());
                          field.onChange(newDate);
                        }
                      }}
                    />
                    <div className='border-t p-3'>
                      <div className='flex justify-between items-center'>
                        <label className='text-sm'>Time:</label>
                        <Input
                          type='time'
                          className='w-40'
                          value={format(field.value, 'HH:mm')}
                          onChange={(e) => {
                            const [hours, minutes] = e.target.value
                              .split(':')
                              .map(Number);
                            const newDate = new Date(field.value);
                            newDate.setHours(hours);
                            newDate.setMinutes(minutes);
                            field.onChange(newDate);
                          }}
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='endTime'
            render={({ field }) => (
              <FormItem className='flex flex-col'>
                <FormLabel>End Date & Time</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant='outline'
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP p')
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className='w-auto p-0' align='start'>
                    <Calendar
                      mode='single'
                      selected={field.value}
                      onSelect={(date) => {
                        if (date) {
                          const newDate = new Date(field.value);
                          newDate.setFullYear(date.getFullYear());
                          newDate.setMonth(date.getMonth());
                          newDate.setDate(date.getDate());
                          field.onChange(newDate);
                        }
                      }}
                    />
                    <div className='border-t p-3'>
                      <div className='flex justify-between items-center'>
                        <label className='text-sm'>Time:</label>
                        <Input
                          type='time'
                          className='w-40'
                          value={format(field.value, 'HH:mm')}
                          onChange={(e) => {
                            const [hours, minutes] = e.target.value
                              .split(':')
                              .map(Number);
                            const newDate = new Date(field.value);
                            newDate.setHours(hours);
                            newDate.setMinutes(minutes);
                            field.onChange(newDate);
                          }}
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
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
                  options={interviewers.map((interviewer) => ({
                    value: interviewer.id,
                    label: interviewer.name,
                  }))}
                  selected={field.value}
                  onChange={field.onChange}
                  placeholder='Select interviewers'
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
            {isEdit ? 'Update Interview' : 'Schedule Interview'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
