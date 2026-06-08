// app/(dashboard)/dashboard/candidates/[id]/delete/page.tsx

import { notFound } from 'next/navigation';
import { getCandidateForDelete } from '@/data/candidate';
import { requirePageOrgRole, toOrgContext } from '@/lib/authz';
import { DeleteResourcePage } from '@/components/dashboard/delete-resource-page';
import { CandidateDeleteForm } from '@/components/candidates/candidate-delete-form';
import { OrganizationRole } from '@/lib/generated/prisma/browser';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DeleteCandidatePageRoute({ params }: PageProps) {
  const user = await requirePageOrgRole([
    OrganizationRole.OWNER,
    OrganizationRole.ADMIN,
    OrganizationRole.MANAGER,
  ]);
  const ctx = toOrgContext(user);
  const { id } = await params;

  const candidate = await getCandidateForDelete(ctx, id);

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
        { label: 'interviews', count: candidate._count.interviews },
        { label: 'feedback entries', count: candidate._count.feedbacks },
        { label: 'notes', count: candidate._count.notes },
      ]}
      cancelHref={`/dashboard/candidates/${candidate.id}`}
    >
      <CandidateDeleteForm candidateId={candidate.id} />
    </DeleteResourcePage>
  );
}
