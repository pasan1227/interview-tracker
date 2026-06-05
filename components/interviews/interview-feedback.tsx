// components/interviews/interview-feedback.tsx

import { Feedback, User } from '@/lib/generated/prisma/browser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  RECOMMENDATION_LABEL,
  RECOMMENDATION_TEXT,
} from '@/lib/constants/status-styles';
import { StarIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDate } from '@/lib/utils';

// Co-interviewer email may be scrubbed by getInterviewByIdForViewer for
// non-manager/admin viewers — see data/interview.ts.
interface InterviewFeedbackProps {
  feedback: Feedback & {
    interviewer: Pick<User, 'id' | 'name' | 'image'> & { email: string | null };
    skillAssessments: {
      id: string;
      skill: string;
      rating: number;
      comment: string | null;
    }[];
  };
}

export function InterviewFeedback({ feedback }: InterviewFeedbackProps) {
  const recommendationLabel = RECOMMENDATION_LABEL[feedback.recommendation];
  const recommendationColor = RECOMMENDATION_TEXT[feedback.recommendation];

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
          <div className={`font-semibold ${recommendationColor}`}>
            {recommendationLabel}
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
