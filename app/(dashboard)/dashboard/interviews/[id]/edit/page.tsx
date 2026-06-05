// app/(dashboard)/dashboard/interviews/[id]/edit/page.tsx (continued)

import { redirect, notFound } from 'next/navigation';
import { requirePageSession } from '@/lib/authz';
import { getInterviewForForm } from '@/data/interview';
import { getInterviewFormOptions } from '@/data/interview-form';
import { InterviewForm } from '@/components/interviews/interview-form-lazy';
import { UserRole } from '@/lib/generated/prisma/browser';

interface EditInterviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditInterviewPage({
  params,
}: EditInterviewPageProps) {
  const session = await requirePageSession();
  const { id } = await params;

  // Interview lookup + form bootstrap run in parallel. Gate runs after
  // we have the interview record.
  const [interview, { candidates, positions, interviewers }] =
    await Promise.all([getInterviewForForm(id), getInterviewFormOptions()]);

  if (!interview) {
    notFound();
  }

  // Mutation gate: matches authorizeInterviewMutation in
  // actions/interview.ts — managers/admins, the creator, or a listed
  // interviewer can edit.
  const isInterviewer = interview.interviewers.some(
    (interviewer) => interviewer.id === session.id
  );
  const isCreator = interview.createdById === session.id;
  const isManagerOrAdmin =
    session.role === UserRole.ADMIN || session.role === UserRole.MANAGER;
  if (!isManagerOrAdmin && !isCreator && !isInterviewer) {
    redirect('/dashboard');
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Edit Interview</h1>
        <p className='text-muted-foreground'>Update the interview details</p>
      </div>

      <div className='rounded-xl border border-border bg-card p-6'>
        <InterviewForm
          interview={interview}
          candidates={candidates}
          positions={positions}
          interviewers={interviewers}
          isEdit
        />
      </div>
    </div>
  );
}
