// components/candidates/candidate-feedback.tsx

import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { StarIcon } from 'lucide-react';
import { Feedback, Recommendation, User } from '@/lib/generated/prisma/browser';

interface CandidateFeedbackProps {
  feedbacks: (Feedback & {
    interviewer: User;
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

  const recommendationConfig = {
    [Recommendation.STRONG_HIRE]: {
      color: 'bg-green-50 text-green-600',
      label: 'Strong Hire',
    },
    [Recommendation.HIRE]: {
      color: 'bg-green-50 text-green-600',
      label: 'Hire',
    },
    [Recommendation.NO_DECISION]: {
      color: 'bg-gray-50 text-gray-600',
      label: 'No Decision',
    },
    [Recommendation.NO_HIRE]: {
      color: 'bg-red-50 text-red-600',
      label: 'No Hire',
    },
    [Recommendation.STRONG_NO_HIRE]: {
      color: 'bg-red-50 text-red-600',
      label: 'Strong No Hire',
    },
  };

  return (
    <div className='space-y-6'>
      {feedbacks.map((feedback) => {
        const rec = recommendationConfig[feedback.recommendation];

        return (
          <div key={feedback.id} className='rounded-md border p-4'>
            <div className='flex items-center justify-between mb-3'>
              <div className='flex items-center gap-3'>
                <h3 className='font-medium'>{feedback.interviewer.name}</h3>
                <Badge variant='outline' className={`${rec.color} border-0`}>
                  {rec.label}
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
                      className='rounded-md bg-slate-50 p-3'
                    >
                      <div className='flex items-center justify-between'>
                        <p className='font-medium text-sm'>
                          {assessment.skill}
                        </p>
                        <div className='flex items-center gap-1'>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <StarIcon
                              key={i}
                              className={`h-4 w-4 ${
                                i < assessment.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
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
