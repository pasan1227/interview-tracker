// app/(dashboard)/dashboard/interviews/[id]/page.tsx

import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { requirePageSession } from '@/lib/authz';
import { getInterviewByIdForViewer } from '@/data/interview';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InterviewDetail } from '@/components/interviews/interview-detail';
import { InterviewStatusAction } from '@/components/interviews/interview-status-action';
import { INTERVIEW_STATUS_BADGE } from '@/lib/constants/status-styles';
import { PencilIcon, TrashIcon, ClipboardIcon } from 'lucide-react';
import { InterviewStatus, UserRole } from '@/lib/generated/prisma/browser';

interface InterviewDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function InterviewDetailPage({
  params,
}: InterviewDetailPageProps) {
  const session = await requirePageSession();
  const { id } = await params;

  const interview = await getInterviewByIdForViewer(id, {
    id: session.id,
    role: session.role,
  });

  if (!interview) {
    notFound();
  }

  // Visibility gate: managers/admins, the interview creator, and the
  // listed interviewers can view this page. Everyone else lands on the
  // dashboard. Mirrors authorizeInterviewMutation in actions/interview.ts.
  const isInterviewer = interview.interviewers.some(
    (interviewer) => interviewer.id === session.id
  );
  const isCreator = interview.createdById === session.id;
  const isManagerOrAdmin =
    session.role === UserRole.ADMIN || session.role === UserRole.MANAGER;
  if (!isManagerOrAdmin && !isCreator && !isInterviewer) {
    redirect('/dashboard');
  }

  const statusClass =
    INTERVIEW_STATUS_BADGE[interview.status] ??
    INTERVIEW_STATUS_BADGE[InterviewStatus.SCHEDULED];

  // Check if the current user has already submitted feedback
  const hasSubmittedFeedback = interview.feedbacks.some(
    (feedback) => feedback.interviewer.id === session.id
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

      <InterviewDetail interview={interview} currentUserId={session.id} />
    </div>
  );
}
