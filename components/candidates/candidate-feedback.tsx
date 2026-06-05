// components/candidates/candidate-feedback.tsx

import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  RECOMMENDATION_BADGE,
  RECOMMENDATION_LABEL,
} from '@/lib/constants/status-styles';
import { StarIcon } from 'lucide-react';
import { Feedback } from '@/lib/generated/prisma/browser';

interface CandidateFeedbackProps {
  feedbacks: (Feedback & {
    interviewer: { id: string; name: string | null };
    skillAssessments: {
      id: string;
      skill: string;
      rating: number;
      comment: string | null;
    }[];
  })[];
}

export function CandidateFeedback({ feedbacks }: CandidateFeedbackProps) {
  if (feedbacks.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center space-y-2 py-8 text-center'>
        <h3 className='text-lg font-semibold'>No feedback submitted yet</h3>
        <p className='text-sm text-muted-foreground'>
          Feedback will appear here once interviewers submit their evaluations
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {feedbacks.map((feedback) => {
        const color = RECOMMENDATION_BADGE[feedback.recommendation];
        const label = RECOMMENDATION_LABEL[feedback.recommendation];

        return (
          <div key={feedback.id} className='rounded-md border p-4'>
            <div className='flex items-center justify-between mb-3'>
              <div className='flex items-center gap-3'>
                <h3 className='font-medium'>{feedback.interviewer.name}</h3>
                <Badge variant='outline' style={color} className='border-0'>
                  {label}
                </Badge>
              </div>
              <div className='text-sm text-muted-foreground'>
                {formatDate(feedback.createdAt)}
              </div>
            </div>

            {feedback.comment && (
              <div className='mb-4 text-sm'>
                <p className='font-medium'>Overall Comments</p>
                <p className='mt-1 whitespace-pre-line'>{feedback.comment}</p>
              </div>
            )}

            {feedback.skillAssessments.length > 0 && (
              <div>
                <p className='font-medium text-sm mb-2'>Skill Assessments</p>
                <div className='space-y-3'>
                  {feedback.skillAssessments.map((assessment) => (
                    <div
                      key={assessment.id}
                      className='rounded-md bg-muted p-3'
                    >
                      <div className='flex items-center justify-between'>
                        <p className='font-medium text-sm'>
                          {assessment.skill}
                        </p>
                        <div
                          className='flex items-center gap-1'
                          role='img'
                          aria-label={`${assessment.rating} out of 5`}
                        >
                          {Array.from({ length: 5 }).map((_, i) => (
                            <StarIcon
                              key={i}
                              aria-hidden
                              className='h-4 w-4'
                              strokeWidth={1.75}
                              style={{
                                color:
                                  i < assessment.rating
                                    ? 'var(--forest)'
                                    : 'var(--border)',
                                fill:
                                  i < assessment.rating
                                    ? 'var(--forest)'
                                    : 'transparent',
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      {assessment.comment && (
                        <p className='mt-1 text-sm'>{assessment.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
