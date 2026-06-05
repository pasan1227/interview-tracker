// app/(dashboard)/dashboard/candidates/new/page.tsx

import { auth } from '@/auth';
import { CandidateForm } from '@/components/candidates/candidate-form';
import { getPositions } from '@/data/position';
import { redirect } from 'next/navigation';

export default async function NewCandidatePage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const positions = await getPositions({ activeOnly: true });
  const positionOptions = positions.map((p) => ({ id: p.id, title: p.title }));

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Add New Candidate</h1>
        <p className='text-muted-foreground'>
          Enter the details for the new candidate
        </p>
      </div>

      <div className='rounded-md border p-6 bg-white'>
        <CandidateForm positions={positionOptions} />
      </div>
    </div>
  );
}
