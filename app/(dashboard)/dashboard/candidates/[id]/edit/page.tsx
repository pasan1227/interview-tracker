// app/(dashboard)/dashboard/candidates/[id]/edit/page.tsx

import { CandidateForm } from '@/components/candidates/candidate-form-lazy';
import { getCandidateForForm } from '@/data/candidate';
import { getPositions } from '@/data/position';
import { requirePageRole } from '@/lib/authz';
import { UserRole } from '@/lib/generated/prisma/browser';
import { notFound } from 'next/navigation';

interface EditCandidatePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCandidatePage({
  params,
}: EditCandidatePageProps) {
  await requirePageRole([UserRole.ADMIN, UserRole.MANAGER]);
  const { id } = await params;

  const [candidate, positions] = await Promise.all([
    getCandidateForForm(id),
    getPositions({ activeOnly: true }),
  ]);
  if (!candidate) notFound();

  const positionOptions = positions.map((p) => ({ id: p.id, title: p.title }));

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Edit Candidate</h1>
        <p className='text-muted-foreground'>
          Update the candidate&apos;s information
        </p>
      </div>

      <div className='rounded-xl border border-border bg-card p-6'>
        <CandidateForm candidate={candidate} positions={positionOptions} isEdit />
      </div>
    </div>
  );
}
