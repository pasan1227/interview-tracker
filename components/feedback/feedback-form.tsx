// components/feedback/feedback-form.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreateFeedbackSchema,
  type CreateFeedbackInput,
} from '@/lib/validations/dashboard';
import {
  Candidate,
  Feedback,
  Interview,
  Position,
  Recommendation,
  SkillAssessment,
} from '@/lib/generated/prisma/browser';
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
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {  PlusIcon, TrashIcon } from 'lucide-react';
import { createFeedback, updateFeedback } from '@/actions/feedback';
import { formatDate } from '@/lib/utils';
import { StarRating } from '@/components/ui/star-rating';
import { ReloadIcon } from '@radix-ui/react-icons';

type FeedbackFormValues = CreateFeedbackInput;

type FeedbackWithSkills = Feedback & { skillAssessments: SkillAssessment[] };

interface FeedbackFormProps {
  feedback?: FeedbackWithSkills | null;
  interview: Interview & {
    candidate: Candidate;
    position: Position;
  };
  isEdit?: boolean;
}

export function FeedbackForm({
  feedback,
  interview,
  isEdit = false,
}: FeedbackFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default values for the form
  const defaultValues: Partial<FeedbackFormValues> = {
    rating: feedback?.rating || 0,
    recommendation: feedback?.recommendation || Recommendation.NO_DECISION,
    comment: feedback?.comment || '',
    interviewId: interview.id,
    candidateId: interview.candidate.id,
    skillAssessments: feedback?.skillAssessments || [
      { skill: '', rating: 0, comment: '' },
    ],
  };

  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(CreateFeedbackSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'skillAssessments',
  });

  async function onSubmit(values: FeedbackFormValues) {
    setIsSubmitting(true);
    setError(null);

    try {
      if (isEdit && feedback) {
        // Update existing feedback
        await updateFeedback(feedback.id, values);
        router.push(`/dashboard/interviews/${interview.id}`);
        router.refresh();
      } else {
        // Create new feedback
        await createFeedback(values);
        router.push(`/dashboard/interviews/${interview.id}`);
        router.refresh();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setError('Failed to save feedback. Please try again.');
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

        <div className='bg-slate-50 p-4 rounded-md mb-6'>
          <h2 className='font-semibold text-lg mb-2'>Interview Details</h2>
          <div className='grid grid-cols-2 gap-4 text-sm'>
            <div>
              <p className='text-muted-foreground'>Candidate:</p>
              <p className='font-medium'>{interview.candidate.name}</p>
            </div>
            <div>
              <p className='text-muted-foreground'>Position:</p>
              <p className='font-medium'>{interview.position.title}</p>
            </div>
            <div>
              <p className='text-muted-foreground'>Date:</p>
              <p className='font-medium'>{formatDate(interview.startTime)}</p>
            </div>
            <div>
              <p className='text-muted-foreground'>Type:</p>
              <p className='font-medium'>{interview.type.replace(/_/g, ' ')}</p>
            </div>
          </div>
        </div>

        <FormField
          control={form.control}
          name='rating'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Overall Rating</FormLabel>
              <FormControl>
                <StarRating value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormDescription>
                Rate the candidate's overall performance in the interview
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='recommendation'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hiring Recommendation</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Select a recommendation' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(Recommendation).map((recommendation) => (
                    <SelectItem key={recommendation} value={recommendation}>
                      {recommendation.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Your recommendation for this candidate
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='comment'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comments</FormLabel>
              <FormControl>
                <Textarea
                  placeholder='Overall feedback about the candidate'
                  className='min-h-32'
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                Provide detailed feedback about the candidate's performance
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <h3 className='font-medium'>Skill Assessments</h3>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => append({ skill: '', rating: 0, comment: '' })}
            >
              <PlusIcon className='mr-2 h-4 w-4' />
              Add Skill
            </Button>
          </div>

          {fields.map((field, index) => (
            <div key={field.id} className='space-y-4 p-4 border rounded-md'>
              <div className='flex items-center justify-between'>
                <h4 className='font-medium'>Skill {index + 1}</h4>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                >
                  <TrashIcon className='h-4 w-4 text-muted-foreground' />
                </Button>
              </div>

              <FormField
                control={form.control}
                name={`skillAssessments.${index}.skill`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skill Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='e.g. Communication, Problem Solving'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`skillAssessments.${index}.rating`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rating</FormLabel>
                    <FormControl>
                      <StarRating
                        value={field.value ?? 0}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`skillAssessments.${index}.comment`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comments</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Specific feedback about this skill'
                        className='min-h-20'
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ))}
        </div>

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
            {isEdit ? 'Update Feedback' : 'Submit Feedback'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
