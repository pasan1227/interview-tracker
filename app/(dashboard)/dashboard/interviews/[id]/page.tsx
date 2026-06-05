// app/(dashboard)/dashboard/interviews/[id]/page.tsx

import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getInterviewById } from '@/data/interview';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InterviewDetail } from '@/components/interviews/interview-detail';
import { InterviewStatusAction } from '@/components/interviews/interview-status-action';
import { PencilIcon, TrashIcon, ClipboardIcon } from 'lucide-react';
import { InterviewStatus } from '@/lib/generated/prisma/browser';

interface InterviewDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function InterviewDetailPage({
  params,
}: InterviewDetailPageProps) {
  const session = await auth();
  const { id } = await params;

  if (!session || !session.user) {
    redirect('/login');
  }

  const interview = await getInterviewById(id);

  if (!interview) {
    notFound();
  }

  const statusConfig = {
    [InterviewStatus.SCHEDULED]: 'bg-blue-50 text-blue-600',
    [InterviewStatus.COMPLETED]: 'bg-green-50 text-green-600',
    [InterviewStatus.CANCELED]: 'bg-red-50 text-red-600',
    [InterviewStatus.NO_SHOW]: 'bg-yellow-50 text-yellow-600',
  };

  const statusClass =
    statusConfig[interview.status] || statusConfig[InterviewStatus.SCHEDULED];

  // Check if the current user is an interviewer for this interview
  const isInterviewer = interview.interviewers.some(
    (interviewer) => interviewer.id === session.user.id
  );

  // Check if the current user has already submitted feedback
  const hasSubmittedFeedback = interview.feedbacks.some(
    (feedback) => feedback.interviewer.id === session.user.id
  );

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <div className='flex items-center gap-3'>
            <h1 className='text-3xl font-bold'>{interview.title}</h1>
            <Badge variant='outline' className={`${statusClass} border-0`}>
              {interview.status.replace(/_/g, ' ')}
            </Badge>
          </div>
          <p className='text-muted-foreground'>
            {interview.type.replace(/_/g, ' ')}
            {interview.stage && ` - ${interview.stage.name}`}
          </p>
        </div>

        <div className='flex items-center gap-2'>
          {interview.status === InterviewStatus.SCHEDULED && (
            <InterviewStatusAction interview={interview} />
          )}

          {interview.status === InterviewStatus.COMPLETED &&
            isInterviewer &&
            !hasSubmittedFeedback && (
              <Button asChild>
                <Link
                  href={`/dashboard/interviews/${interview.id}/feedback/new`}
                >
                  <ClipboardIcon className='mr-2 h-4 w-4' />
                  Submit Feedback
                </Link>
              </Button>
            )}

          <Button variant='outline' asChild>
            <Link href={`/dashboard/interviews/${interview.id}/edit`}>
              <PencilIcon className='mr-2 h-4 w-4' />
              Edit
            </Link>
          </Button>

          <Button variant='outline' className='text-red-600' asChild>
            <Link href={`/dashboard/interviews/${interview.id}/delete`}>
              <TrashIcon className='mr-2 h-4 w-4' />
              Delete
            </Link>
          </Button>
        </div>
      </div>

      <InterviewDetail interview={interview} currentUserId={session.user.id as string} />
    </div>
  );
}
