// app/(dashboard)/dashboard/candidates/[id]/delete/page.tsx

import { notFound } from 'next/navigation';
import { getCandidateById } from '@/data/candidate';
import { requirePageRole } from '@/lib/authz';
import { DeleteResourcePage } from '@/components/dashboard/delete-resource-page';
import { CandidateDeleteForm } from '@/components/candidates/candidate-delete-form';
import { UserRole } from '@/lib/generated/prisma/browser';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DeleteCandidatePageRoute({ params }: PageProps) {
  await requirePageRole([UserRole.ADMIN, UserRole.MANAGER]);
  const { id } = await params;

  const candidate = await getCandidateById(id);

  if (!candidate) {
    notFound();
  }

  return (
    <DeleteResourcePage
      title='Delete candidate'
      description='Are you sure you want to delete this candidate?'
      resourceLabel='candidate'
      resourceName={candidate.name}
      detailsHeading='Candidate information'
      details={[
        { label: 'Name', value: candidate.name },
        { label: 'Email', value: candidate.email },
        { label: 'Position', value: candidate.position?.title ?? 'No position' },
        { label: 'Status', value: candidate.status.replace(/_/g, ' ') },
      ]}
      impact={[
        { label: 'interviews', count: candidate.interviews.length },
        { label: 'feedback entries', count: candidate.feedbacks.length },
        { label: 'notes', count: candidate.notes.length },
      ]}
      cancelHref={`/dashboard/candidates/${candidate.id}`}
    >
      <CandidateDeleteForm candidateId={candidate.id} />
    </DeleteResourcePage>
  );
}
