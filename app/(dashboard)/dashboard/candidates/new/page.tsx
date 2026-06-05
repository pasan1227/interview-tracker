// app/(dashboard)/dashboard/candidates/new/page.tsx

import { auth } from '@/auth';
import { CandidateForm } from '@/components/candidates/candidate-form-lazy';
import { PageHeader } from '@/components/dashboard/page-header';
import { getPositions } from '@/data/position';
import { redirect } from 'next/navigation';

export default async function NewCandidatePage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const positions = await getPositions({ activeOnly: true });
  const positionOptions = positions.map((p) => ({ id: p.id, title: p.title }));

  return (
    <div className='mx-auto flex max-w-[1200px] flex-col gap-6'>
      <PageHeader
        eyebrow='New'
        title='Add new candidate'
        description='Enter the details for the new candidate.'
      />

      <div className='rounded-xl border border-border bg-card p-6'>
        <CandidateForm positions={positionOptions} />
      </div>
    </div>
  );
}
