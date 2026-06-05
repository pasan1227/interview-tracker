// app/(dashboard)/dashboard/candidates/page.tsx

import { auth } from '@/auth';
import { CandidatesFilters } from '@/components/candidates/candidates-filters';
import { CandidatesList } from '@/components/candidates/candidates-list';
import { ResourceSearch } from '@/components/ui/resource-search';
import { PageHeader } from '@/components/dashboard/page-header';
import { Button } from '@/components/ui/button';
import { getPositions } from '@/data/position';
import { PlusIcon } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import Loading from './loading';

interface CandidatesPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
    position?: string;
  }>;
}

export default async function CandidatesPage({
  searchParams,
}: CandidatesPageProps) {
  const session = await auth();

  if (!session || !session.user) {
    redirect('/login');
  }

  const [awaitedParams, positions] = await Promise.all([
    searchParams,
    getPositions({ activeOnly: true }),
  ]);

  const page = Number(awaitedParams.page) || 1;
  const search = awaitedParams.search || '';
  const status = awaitedParams.status || '';
  const position = awaitedParams.position || '';

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
