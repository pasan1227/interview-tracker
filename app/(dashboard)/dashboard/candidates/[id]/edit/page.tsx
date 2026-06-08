// app/(dashboard)/dashboard/candidates/[id]/edit/page.tsx

import { CandidateForm } from '@/components/candidates/candidate-form-lazy';
import { PageHeader } from '@/components/dashboard/page-header';
import { getCandidateForForm } from '@/data/candidate';
import { getPositions } from '@/data/position';
import { requirePageOrgRole, toOrgContext } from '@/lib/authz';
import { OrganizationRole } from '@/lib/generated/prisma/browser';
import { notFound } from 'next/navigation';

interface EditCandidatePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCandidatePage({
  params,
}: EditCandidatePageProps) {
  const user = await requirePageOrgRole([
    OrganizationRole.OWNER,
    OrganizationRole.ADMIN,
    OrganizationRole.MANAGER,
  ]);
  const ctx = toOrgContext(user);
  const { id } = await params;

  const [candidate, positions] = await Promise.all([
    getCandidateForForm(ctx, id),
    getPositions(ctx, { activeOnly: true }),
  ]);
  if (!candidate) notFound();

  const positionOptions = positions.map((p) => ({ id: p.id, title: p.title }));

  return (
    <div className='mx-auto flex max-w-[1200px] flex-col gap-6'>
      <PageHeader
        eyebrow='Edit'
        title='Edit candidate'
        description="Update the candidate's information."
      />

      <div className='rounded-xl border border-border bg-card p-6'>
        <CandidateForm candidate={candidate} positions={positionOptions} isEdit />
      </div>
    </div>
  );
}
