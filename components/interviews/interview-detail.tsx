// components/interviews/interview-detail.tsx

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FEEDBACK_PENDING_BADGE,
  FEEDBACK_SUBMITTED_BADGE,
} from '@/lib/constants/status-styles';
import {
  Candidate,
  Feedback,
  Interview,
  InterviewStatus,
  Position,
  Stage,
  User,
} from '@/lib/generated/prisma/browser';
import { format } from 'date-fns';
import {
  BriefcaseIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClipboardIcon,
  MapPinIcon,
  UserIcon,
  XCircleIcon,
} from 'lucide-react';
import Link from 'next/link';
import { InterviewFeedback } from './interview-feedback';

// `email` is nullable on co-interviewers' rows because getInterview
// ByIdForViewer scrubs it for non-manager/admin viewers — see data/
// interview.ts. The component must guard each render against null.
type DetailedFeedback = Feedback & {
  interviewer: Pick<User, 'id' | 'name' | 'image'> & {
    email: string | null;
  };
  skillAssessments: {
    id: string;
    skill: string;
    rating: number;
    comment: string | null;
  }[];
};

type DetailedInterview = Interview & {
  candidate: Candidate;
  position: Position;
  interviewers: (Pick<User, 'id' | 'name' | 'image' | 'role'> & {
    email: string | null;
  })[];
  stage: Stage | null;
  feedbacks: DetailedFeedback[];
};

interface InterviewDetailProps {
  interview: DetailedInterview;
  currentUserId: string;
}

export function InterviewDetail({
  interview,
  currentUserId,
}: InterviewDetailProps) {
  // Check if the current user is an interviewer
  const isInterviewer = interview.interviewers.some(
    (interviewer) => interviewer.id === currentUserId
  );

  // Check if the current user has already submitted feedback
  const hasSubmittedFeedback = interview.feedbacks.some(
    (feedback) => feedback.interviewer.id === currentUserId
  );

  // Format dates
  const startTime = new Date(interview.startTime);
  const endTime = new Date(interview.endTime);
  const formattedDate = format(startTime, 'EEEE, MMMM d, yyyy');
  const formattedStartTime = format(startTime, 'h:mm a');
  const formattedEndTime = format(endTime, 'h:mm a');

  // Calculate duration in minutes
  const durationMinutes = Math.round(
    (endTime.getTime() - startTime.getTime()) / (1000 * 60)
  );
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  const formattedDuration = `${hours > 0 ? `${hours} hour${hours > 1 ? 's' : ''}` : ''}${
    hours > 0 && minutes > 0 ? ' ' : ''
  }${minutes > 0 ? `${minutes} minute${minutes > 1 ? 's' : ''}` : ''}`;

  // Is the location a URL?
  const isUrlLocation = interview.location?.startsWith('http');

  return (
    <div className='space-y-6'>
      <div className='grid gap-6 md:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>Interview Details</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-[20px_1fr] gap-x-3 gap-y-2 items-start'>
              <CalendarIcon className='h-5 w-5 text-muted-foreground' />
              <div>
                <p className='font-medium'>{formattedDate}</p>
                <p className='text-sm text-muted-foreground'>
                  {formattedStartTime} - {formattedEndTime} ({formattedDuration}
                  )
                </p>
              </div>

              {interview.location && (
                <>
                  <MapPinIcon className='h-5 w-5 text-muted-foreground' />
                  <div>
                    {isUrlLocation ? (
                      <a
                        href={interview.location}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='font-medium text-primary hover:underline'
                      >
                        Join Meeting
                      </a>
                    ) : (
                      <p className='font-medium'>{interview.location}</p>
                    )}
                  </div>
                </>
              )}

              <UserIcon className='h-5 w-5 text-muted-foreground' />
              <div>
                <Link
                  href={`/dashboard/candidates/${interview.candidate.id}`}
                  className='font-medium text-primary hover:underline'
                >
                  {interview.candidate.name}
                </Link>
                <p className='text-sm text-muted-foreground'>
                  {interview.candidate.email}
                </p>
              </div>

              <BriefcaseIcon className='h-5 w-5 text-muted-foreground' />
              <div>
                <p className='font-medium'>{interview.position.title}</p>
                {interview.position.department && (
                  <p className='text-sm text-muted-foreground'>
                    {interview.position.department}
                  </p>
                )}
              </div>
            </div>

            {interview.notes && (
              <div className='mt-4 pt-4 border-t'>
                <h3 className='font-medium mb-2'>Notes</h3>
                <p className='text-sm whitespace-pre-line'>{interview.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interviewers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {interview.interviewers.map((interviewer) => {
                const hasFeedback = interview.feedbacks.some(
                  (feedback) => feedback.interviewer.id === interviewer.id
                );

                return (
                  <div
                    key={interviewer.id}
                    className='flex items-center justify-between'
                  >
                    <div className='flex items-center gap-3'>
                      <Avatar>
                        <AvatarImage
                          src={interviewer.image || ''}
                          alt={interviewer.name || ''}
                        />
                        <AvatarFallback>
                          {interviewer.name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className='font-medium'>{interviewer.name}</p>
                        {interviewer.email && (
                          <p className='text-xs text-muted-foreground'>
                            {interviewer.email}
                          </p>
                        )}
                      </div>
                    </div>

                    {interview.status === InterviewStatus.COMPLETED &&
                      (hasFeedback ? (
                        <Badge
                          variant='outline'
                          style={FEEDBACK_SUBMITTED_BADGE}
                          className='border-0'
                        >
                          <CheckCircleIcon className='mr-1 h-3 w-3' />
                          Feedback Submitted
                        </Badge>
                      ) : (
                        <Badge
                          variant='outline'
                          style={FEEDBACK_PENDING_BADGE}
                          className='border-0'
                        >
                          <XCircleIcon className='mr-1 h-3 w-3' />
                          Pending Feedback
                        </Badge>
                      ))}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {interview.status === InterviewStatus.COMPLETED && (
        <Tabs defaultValue='feedback' className='space-y-4'>
          <TabsList>
            <TabsTrigger value='feedback'>
              Feedback ({interview.feedbacks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value='feedback' className='space-y-4'>
            {interview.feedbacks.length > 0 ? (
              interview.feedbacks.map((feedback) => (
                <InterviewFeedback key={feedback.id} feedback={feedback} />
              ))
            ) : (
              <Card>
                <CardContent className='flex flex-col items-center justify-center py-6'>
                  <ClipboardIcon className='h-12 w-12 text-muted-foreground mb-3' />
                  <h3 className='text-lg font-semibold'>
                    No feedback submitted yet
                  </h3>
                  <p className='text-sm text-muted-foreground mb-4'>
                    Interviewers haven't submitted their feedback for this
                    interview.
                  </p>
                  {isInterviewer && !hasSubmittedFeedback && (
                    <Button asChild>
                      <Link
                        href={`/dashboard/interviews/${interview.id}/feedback/new`}
                      >
                        Submit Your Feedback
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
