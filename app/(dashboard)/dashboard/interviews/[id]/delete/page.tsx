// app/(dashboard)/dashboard/interviews/[id]/delete/page.tsx

import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getInterviewById } from '@/data/interview';
import { Button } from '@/components/ui/button';
import { InterviewDeleteForm } from '@/components/interviews/interview-delete-form';
import { UserRole } from '@/lib/generated/prisma/browser';
import { format } from 'date-fns';

interface DeleteInterviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function DeleteInterviewPage({
  params,
}: DeleteInterviewPageProps) {
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
  // actions/interview.ts.
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
        <h1 className='text-3xl font-bold'>Delete Interview</h1>
        <p className='text-muted-foreground'>
          Are you sure you want to delete this interview?
        </p>
      </div>

      <div className='rounded-md border p-6 bg-white'>
        <div className='space-y-4'>
          <div>
            <h2 className='text-xl font-bold text-red-600'>Warning</h2>
            <p className='text-muted-foreground'>
              This action cannot be undone. This will permanently delete the
              interview
              <span className='font-semibold'> {interview.title} </span>
              with
              <span className='font-semibold'>
                {' '}
                {interview.candidate.name}{' '}
              </span>
              and all associated feedback.
            </p>
          </div>

          <div className='border rounded-md p-4 bg-slate-50'>
            <h3 className='font-semibold'>Interview Information</h3>
            <div className='mt-2 space-y-1 text-sm'>
              <p>
                <span className='text-muted-foreground'>Title:</span>{' '}
                {interview.title}
              </p>
              <p>
                <span className='text-muted-foreground'>Candidate:</span>{' '}
                {interview.candidate.name}
              </p>
              <p>
                <span className='text-muted-foreground'>Position:</span>{' '}
                {interview.position.title}
              </p>
              <p>
                <span className='text-muted-foreground'>Date & Time:</span>{' '}
                {format(new Date(interview.startTime), 'PPP p')} -{' '}
                {format(new Date(interview.endTime), 'p')}
              </p>
              <p>
                <span className='text-muted-foreground'>Status:</span>{' '}
                {interview.status.replace(/_/g, ' ')}
              </p>
            </div>
          </div>

          <InterviewDeleteForm interviewId={interview.id} />

          <div className='flex justify-end'>
            <Button variant='outline' asChild>
              <Link href={`/dashboard/interviews/${interview.id}`}>Cancel</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
