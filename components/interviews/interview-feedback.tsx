// components/interviews/interview-feedback.tsx

import { Feedback, Recommendation, User } from '@/lib/generated/prisma/browser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StarIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDate } from '@/lib/utils';

interface InterviewFeedbackProps {
  feedback: Feedback & {
    interviewer: Pick<User, 'id' | 'name' | 'email' | 'image'>;
    skillAssessments: {
      id: string;
      skill: string;
      rating: number;
      comment: string | null;
    }[];
  };
}

export function InterviewFeedback({ feedback }: InterviewFeedbackProps) {
  const recommendationConfig = {
    [Recommendation.STRONG_HIRE]: {
      label: 'Strong Hire',
      color: 'text-green-600',
    },
    [Recommendation.HIRE]: { label: 'Hire', color: 'text-green-600' },
    [Recommendation.NO_DECISION]: {
      label: 'No Decision',
      color: 'text-gray-600',
    },
    [Recommendation.NO_HIRE]: { label: 'No Hire', color: 'text-red-600' },
    [Recommendation.STRONG_NO_HIRE]: {
      label: 'Strong No Hire',
      color: 'text-red-600',
    },
  };

  const recommendation = recommendationConfig[feedback.recommendation];

  return (
    <Card>
      <CardHeader className='pb-2'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <Avatar>
              <AvatarImage
                src={feedback.interviewer.image || ''}
                alt={feedback.interviewer.name || ''}
              />
              <AvatarFallback>
                {feedback.interviewer.name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className='text-base'>
                {feedback.interviewer.name}
              </CardTitle>
              <p className='text-xs text-muted-foreground'>
                {formatDate(feedback.createdAt)}
              </p>
            </div>
          </div>
          <div className={`font-semibold ${recommendation.color}`}>
            {recommendation.label}
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        {feedback.comment && (
          <div className='pt-2'>
            <h3 className='text-sm font-semibold mb-1'>Overall Feedback</h3>
            <p className='text-sm whitespace-pre-line'>{feedback.comment}</p>
          </div>
        )}

        {feedback.skillAssessments.length > 0 && (
          <div>
            <h3 className='text-sm font-semibold mb-2'>Skill Assessments</h3>
            <div className='space-y-3'>
              {feedback.skillAssessments.map((assessment) => (
                <div key={assessment.id} className='rounded-md bg-slate-50 p-3'>
                  <div className='flex items-center justify-between'>
                    <p className='font-medium text-sm'>{assessment.skill}</p>
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
      </CardContent>
    </Card>
  );
}
