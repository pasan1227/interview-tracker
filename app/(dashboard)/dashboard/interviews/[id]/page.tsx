// app/(dashboard)/dashboard/interviews/[id]/page.tsx

import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { requirePageSession } from '@/lib/authz';
import { getInterviewByIdForViewer } from '@/data/interview';
import { PageHeader } from '@/components/dashboard/page-header';
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

  // Read-only visibility: managers/admins, the interview creator, the
  // listed interviewers, and anyone who has authored feedback on the
  // interview can view it. The feedback-author branch covers the case
  // where someone was removed from the interviewer roster after they
  // submitted feedback — the row still shows up in their "My feedback"
  // list, and View should not lead to a redirect.
  const isInterviewer = interview.interviewers.some(
    (interviewer) => interviewer.id === session.id
  );
  const isCreator = interview.createdById === session.id;
  const isManagerOrAdmin =
    session.role === UserRole.ADMIN || session.role === UserRole.MANAGER;
  const hasSubmittedFeedback = interview.feedbacks.some(
    (feedback) => feedback.interviewer.id === session.id
  );
  if (
    !isManagerOrAdmin &&
    !isCreator &&
    !isInterviewer &&
    !hasSubmittedFeedback
  ) {
    redirect('/dashboard');
  }

  // Mutate gate (edit button): the read-only feedback-author path above
  // does NOT carry mutation rights. Matches authorizeInterviewMutation
  // in actions/interview.ts.
  const canMutate = isManagerOrAdmin || isCreator || isInterviewer;
  // Delete is further restricted: listed interviewers shouldn't be able
  // to destroy an interview record they were merely assigned to.
  const canDelete = isManagerOrAdmin || isCreator;

  const statusClass =
    INTERVIEW_STATUS_BADGE[interview.status] ??
    INTERVIEW_STATUS_BADGE[InterviewStatus.SCHEDULED];

  return (
    <div className='mx-auto flex max-w-[1200px] flex-col gap-6'>
      <PageHeader
        eyebrow='Interview'
        title={interview.title}
        description={`${interview.type.replace(/_/g, ' ')}${
          interview.stage ? ` · ${interview.stage.name}` : ''
        }`}
        action={
          <div className='flex flex-wrap items-center gap-2'>
            <Badge variant='outline' style={statusClass} className='border-0'>
              {interview.status.replace(/_/g, ' ')}
            </Badge>
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
                    Submit feedback
                  </Link>
                </Button>
              )}
            {canMutate && (
              <Button variant='outline' asChild>
                <Link href={`/dashboard/interviews/${interview.id}/edit`}>
                  <PencilIcon className='mr-2 h-4 w-4' />
                  Edit
                </Link>
              </Button>
            )}
            {canDelete && (
              <Button variant='outline' className='text-destructive' asChild>
                <Link href={`/dashboard/interviews/${interview.id}/delete`}>
                  <TrashIcon className='mr-2 h-4 w-4' />
                  Delete
                </Link>
              </Button>
            )}
          </div>
        }
      />

      <InterviewDetail interview={interview} currentUserId={session.id} />
    </div>
  );
}
