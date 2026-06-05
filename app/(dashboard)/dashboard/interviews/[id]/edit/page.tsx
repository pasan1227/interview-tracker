// app/(dashboard)/dashboard/interviews/[id]/edit/page.tsx (continued)

import { redirect, notFound } from 'next/navigation';
import { auth } from '@/auth';
import { getInterviewById } from '@/data/interview';
import { getInterviewFormOptions } from '@/data/interview-form';
import { InterviewForm } from '@/components/interviews/interview-form';
import { UserRole } from '@/lib/generated/prisma/browser';

interface EditInterviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditInterviewPage({
  params,
}: EditInterviewPageProps) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user) {
    redirect('/login');
  }

  // Interview lookup + form bootstrap run in parallel. Gate runs after
  // we have the interview record.
  const [interview, { candidates, positions, interviewers }] = await Promise.all([
    getInterviewById(id),
    getInterviewFormOptions(),
  ]);

  if (!interview) {
    notFound();
  }

  // Mutation gate: matches authorizeInterviewMutation in
  // actions/interview.ts — managers/admins, the creator, or a listed
  // interviewer can edit.
  const isInterviewer = interview.interviewers.some(
    (interviewer) => interviewer.id === session.user.id
  );
  const isCreator = interview.createdById === session.user.id;
  const isManagerOrAdmin =
    session.user.role === UserRole.ADMIN ||
    session.user.role === UserRole.MANAGER;
  if (!isManagerOrAdmin && !isCreator && !isInterviewer) {
    redirect('/dashboard');
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Edit Interview</h1>
        <p className='text-muted-foreground'>Update the interview details</p>
      </div>

      <div className='rounded-md border p-6 bg-white'>
        <InterviewForm
          //@ts-expect-error Interview type mismatch
          interview={interview}
          candidates={candidates}
          positions={positions}
          //@ts-expect-error Interview type mismatch
          interviewers={interviewers}
          isEdit
        />
      </div>
    </div>
  );
}
