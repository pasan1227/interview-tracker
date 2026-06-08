// app/(dashboard)/candidates/new/page.tsx

import { CandidateForm } from '@/components/candidates/candidate-form-lazy';
import { PageHeader } from '@/components/page-header';
import { getPositions } from '@/data/position';
import { requirePageOrgSession, toOrgContext } from '@/lib/authz';

export default async function NewCandidatePage() {
  const user = await requirePageOrgSession();
  const positions = await getPositions(toOrgContext(user), { activeOnly: true });
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
