// app/(dashboard)/dashboard/interviews/[id]/delete/page.tsx

import { redirect, notFound } from 'next/navigation';
import { requirePageSession } from '@/lib/authz';
import { getInterviewById } from '@/data/interview';
import { DeleteResourcePage } from '@/components/dashboard/delete-resource-page';
import { InterviewDeleteForm } from '@/components/interviews/interview-delete-form';
import { UserRole } from '@/lib/generated/prisma/browser';
import { format } from 'date-fns';

interface DeleteInterviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function DeleteInterviewPageRoute({
  params,
}: DeleteInterviewPageProps) {
  const session = await requirePageSession();
  const { id } = await params;

  const interview = await getInterviewById(id);
  if (!interview) notFound();

  // Delete gate: matches deleteInterview in actions/interview.ts —
  // manager/admin or the original creator. Listed interviewers can
  // edit notes/status but cannot destroy the record.
  const isCreator = interview.createdById === session.id;
  const isManagerOrAdmin =
    session.role === UserRole.ADMIN || session.role === UserRole.MANAGER;
  if (!isManagerOrAdmin && !isCreator) {
    redirect('/dashboard');
  }

  return (
    <DeleteResourcePage
      title='Delete interview'
      description='Are you sure you want to delete this interview?'
      resourceLabel='interview'
      resourceName={interview.title}
      detailsHeading='Interview information'
      details={[
        { label: 'Title', value: interview.title },
        { label: 'Candidate', value: interview.candidate.name },
        { label: 'Position', value: interview.position.title },
        {
          label: 'Date & time',
          value: `${format(new Date(interview.startTime), 'PPP p')} - ${format(
            new Date(interview.endTime),
            'p'
          )}`,
        },
        { label: 'Status', value: interview.status.replace(/_/g, ' ') },
      ]}
      cancelHref={`/dashboard/interviews/${interview.id}`}
    >
      <InterviewDeleteForm interviewId={interview.id} />
    </DeleteResourcePage>
  );
}
