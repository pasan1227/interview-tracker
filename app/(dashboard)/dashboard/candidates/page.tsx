// app/(dashboard)/dashboard/candidates/page.tsx

import { requirePageSession } from '@/lib/authz';
import { CandidatesFilters } from '@/components/candidates/candidates-filters';
import { CandidatesList } from '@/components/candidates/candidates-list';
import { ResourceSearch } from '@/components/ui/resource-search';
import { PageHeader } from '@/components/dashboard/page-header';
import { Button } from '@/components/ui/button';
import { getPositions } from '@/data/position';
import { CandidatesSearchParamsSchema } from '@/lib/search-params';
import { PlusIcon } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import Loading from './loading';

interface CandidatesPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function CandidatesPage({
  searchParams,
}: CandidatesPageProps) {
  await requirePageSession();

  const [awaitedParams, positions] = await Promise.all([
    searchParams,
    getPositions({ activeOnly: true }),
  ]);

  const { page, search, status, position } =
    CandidatesSearchParamsSchema.parse(awaitedParams);

  const positionOptions = positions.map((p) => ({ id: p.id, title: p.title }));

  return (
    <div className='mx-auto flex max-w-[1200px] flex-col gap-6'>
      <PageHeader
        eyebrow='Pipeline'
        title='Candidates'
        description='Manage and track candidates in your pipeline.'
        action={
          <Button asChild>
            <Link href='/dashboard/candidates/new'>
              <PlusIcon className='mr-2 h-4 w-4' />
              Add candidate
            </Link>
          </Button>
        }
      />

      <div className='flex items-center justify-between space-x-4'>
        <ResourceSearch placeholder='Search candidates...' />
        <CandidatesFilters positions={positionOptions} />
      </div>

      <Suspense fallback={<Loading />}>
        <CandidatesList
          page={page}
          search={search}
          status={status}
          position={position}
        />
      </Suspense>
    </div>
  );
}
