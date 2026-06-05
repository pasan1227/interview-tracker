// app/(dashboard)/dashboard/interviews/[id]/feedback/new/page.tsx

import { redirect, notFound } from 'next/navigation';
import { auth } from '@/auth';
import { getInterviewById } from '@/data/interview';
import { FeedbackForm } from '@/components/feedback/feedback-form-lazy';
import { InterviewStatus } from '@/lib/generated/prisma/browser';

interface NewFeedbackPageProps {
  params: Promise<{ id: string }>;
}

export default async function NewFeedbackPage({
  params,
}: NewFeedbackPageProps) {
  const session = await auth();
  const { id } = await params;

  if (!session || !session.user) {
    redirect('/login');
  }

  const interview = await getInterviewById(id);

  if (!interview) {
    notFound();
  }

  // Ensure the interview is completed
  if (interview.status !== InterviewStatus.COMPLETED) {
    redirect(`/dashboard/interviews/${id}`);
  }

  // Check if the current user is an interviewer for this interview
  const isInterviewer = interview.interviewers.some(
    (interviewer) => interviewer.id === session.user.id
  );

  if (!isInterviewer) {
    redirect(`/dashboard/interviews/${id}`);
  }

  // Check if the user has already submitted feedback
  const hasSubmittedFeedback = interview.feedbacks.some(
    (feedback) => feedback.interviewer.id === session.user.id
  );

  if (hasSubmittedFeedback) {
    redirect(`/dashboard/interviews/${id}`);
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Submit Feedback</h1>
        <p className='text-muted-foreground'>
          Provide your evaluation of the candidate&apos;s performance
        </p>
      </div>

      <div className='rounded-md border p-6 bg-white'>
        <FeedbackForm interview={interview} />
      </div>
    </div>
  );
}
