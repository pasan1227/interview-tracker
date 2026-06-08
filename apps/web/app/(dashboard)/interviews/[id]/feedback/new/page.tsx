// app/(dashboard)/interviews/[id]/feedback/new/page.tsx

import { redirect, notFound } from 'next/navigation';
import { requirePageOrgSession, toOrgContext } from '@/lib/authz';
import { getInterviewById } from '@/data/interview';
import { PageHeader } from '@/components/dashboard/page-header';
import { FeedbackForm } from '@/components/feedback/feedback-form-lazy';
import { InterviewStatus } from '@/lib/generated/prisma/browser';

interface NewFeedbackPageProps {
  params: Promise<{ id: string }>;
}

export default async function NewFeedbackPage({
  params,
}: NewFeedbackPageProps) {
  const session = await requirePageOrgSession();
  const { id } = await params;

  const interview = await getInterviewById(toOrgContext(session), id);

  if (!interview) {
    notFound();
  }

  // Ensure the interview is completed
  if (interview.status !== InterviewStatus.COMPLETED) {
    redirect(`/interviews/${id}`);
  }

  // Check if the current user is an interviewer for this interview
  const isInterviewer = interview.interviewers.some(
    (interviewer) => interviewer.id === session.id
  );

  if (!isInterviewer) {
    redirect(`/interviews/${id}`);
  }

  // Check if the user has already submitted feedback
  const hasSubmittedFeedback = interview.feedbacks.some(
    (feedback) => feedback.interviewer.id === session.id
  );

  if (hasSubmittedFeedback) {
    redirect(`/interviews/${id}`);
  }

  return (
    <div className='mx-auto flex max-w-[1200px] flex-col gap-6'>
      <PageHeader
        eyebrow='Feedback'
        title='Submit feedback'
        description="Provide your evaluation of the candidate's performance."
      />

      <div className='rounded-xl border border-border bg-card p-6'>
        <FeedbackForm interview={interview} />
      </div>
    </div>
  );
}
