// app/(dashboard)/dashboard/candidates/[id]/edit/page.tsx

import { auth } from '@/auth';
import { CandidateForm } from '@/components/candidates/candidate-form';
import { getCandidateById } from '@/data/candidate';
import { getPositions } from '@/data/position';
import { notFound, redirect } from 'next/navigation';

interface EditCandidatePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCandidatePage({
  params,
}: EditCandidatePageProps) {
  const session = await auth();
  const { id } = await params;
  if (!session?.user) redirect('/login');

  const [candidate, positions] = await Promise.all([
    getCandidateById(id),
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

      <div className='rounded-md border p-6 bg-white'>
        <CandidateForm candidate={candidate} positions={positionOptions} isEdit />
      </div>
    </div>
  );
}
