// app/(dashboard)/dashboard/interviews/[id]/edit/page.tsx (continued)

import { redirect, notFound } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getInterviewById } from '@/data/interview';
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

  const interview = await getInterviewById(id);

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

  // Get candidates (filtering out any non-active ones)
  const candidates = await db.candidate.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      positionId: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  // Get positions (only active ones)
  const positions = await db.position.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      title: true,
    },
    orderBy: {
      title: 'asc',
    },
  });

  // Get all users who can be interviewers (excluding system users)
  const interviewers = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

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
