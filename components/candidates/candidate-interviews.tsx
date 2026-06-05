// components/candidates/candidate-interviews.tsx

import Link from 'next/link';
import { formatDateTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { INTERVIEW_STATUS_BADGE } from '@/lib/constants/status-styles';
import { CalendarIcon, ClockIcon, MapPinIcon, UsersIcon } from 'lucide-react';
import { Interview, InterviewStatus, Stage } from '@/lib/generated/prisma/browser';

interface CandidateInterviewsProps {
  interviews: (Interview & {
    // Narrow to the fields the row actually renders. Keeping password off
    // the prop type stops future server-side `include: { interviewers: true }`
    // from re-introducing the leak through this surface.
    interviewers: Array<{ id: string; name: string | null }>;
    stage: Stage | null;
  })[];
}

export function CandidateInterviews({ interviews }: CandidateInterviewsProps) {
  if (interviews.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center space-y-2 py-8 text-center'>
        <h3 className='text-lg font-semibold'>No interviews scheduled</h3>
        <p className='text-sm text-muted-foreground'>
          Schedule an interview to begin the evaluation process
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {interviews.map((interview) => {
        const color =
          INTERVIEW_STATUS_BADGE[interview.status] ??
          INTERVIEW_STATUS_BADGE[InterviewStatus.SCHEDULED];

        return (
          <div
            key={interview.id}
            className='flex flex-col space-y-3 rounded-md border p-4'
          >
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <h3 className='font-medium'>{interview.title}</h3>
                <Badge variant='outline' className={`${color} border-0`}>
                  {interview.status.replace(/_/g, ' ')}
                </Badge>
              </div>
              <Button asChild variant='outline' size='sm'>
                <Link href={`/dashboard/interviews/${interview.id}`}>
                  View Details
                </Link>
              </Button>
            </div>

            <div className='grid gap-3 md:grid-cols-2'>
              <div className='flex items-center gap-2 text-sm'>
                <CalendarIcon className='h-4 w-4 text-muted-foreground' />
                <span>{formatDateTime(interview.startTime)}</span>
              </div>

              <div className='flex items-center gap-2 text-sm'>
                <ClockIcon className='h-4 w-4 text-muted-foreground' />
                <span>
                  {new Date(interview.startTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  -{' '}
                  {new Date(interview.endTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              {interview.location && (
                <div className='flex items-center gap-2 text-sm'>
                  <MapPinIcon className='h-4 w-4 text-muted-foreground' />
                  <span>{interview.location}</span>
                </div>
              )}

              <div className='flex items-center gap-2 text-sm'>
                <UsersIcon className='h-4 w-4 text-muted-foreground' />
                <span>
                  {interview.interviewers.length > 0
                    ? interview.interviewers
                        .map((interviewer) => interviewer.name)
                        .join(', ')
                    : 'No interviewers assigned'}
                </span>
              </div>
            </div>

            {interview.stage && (
              <div className='text-sm'>
                <span className='text-muted-foreground'>Stage: </span>
                <span>{interview.stage.name}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
