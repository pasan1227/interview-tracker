// app/(dashboard)/dashboard/candidates/page.tsx

import { auth } from '@/auth';
import { CandidatesFilters } from '@/components/candidates/candidates-filters';
import { CandidatesList } from '@/components/candidates/candidates-list';
import { CandidatesSearch } from '@/components/candidates/candidates-search';
import { Button } from '@/components/ui/button';
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

  const awaitedParams = await searchParams;

  const page = Number(awaitedParams.page) || 1;
  const search = awaitedParams.search || '';
  const status = awaitedParams.status || '';
  const position = awaitedParams.position || '';

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Candidates</h1>
          <p className='text-muted-foreground'>
            Manage and track candidates in your pipeline
          </p>
        </div>
        <Button asChild>
          <Link href='/dashboard/candidates/new'>
            <PlusIcon className='mr-2 h-4 w-4' />
            Add Candidate
          </Link>
        </Button>
      </div>

      <div className='flex items-center justify-between space-x-4'>
        <CandidatesSearch />
        <CandidatesFilters />
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
