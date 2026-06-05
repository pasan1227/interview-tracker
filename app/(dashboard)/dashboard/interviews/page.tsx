// app/(dashboard)/dashboard/interviews/page.tsx

import { auth } from '@/auth';
import { PageHeader } from '@/components/dashboard/page-header';
import { InterviewsFilters } from '@/components/interviews/interviews-filters';
import { InterviewsList } from '@/components/interviews/interviews-list';
import { InterviewsSearch } from '@/components/interviews/interviews-search';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import Loading from './loading';

interface InterviewsPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
    type?: string;
    date?: string;
  }>;
}

export default async function InterviewsPage({
  searchParams,
}: InterviewsPageProps) {
  const session = await auth();
  const awaitedParams = await searchParams;

  if (!session || !session.user) {
    redirect('/login');
  }

  const page = Number(awaitedParams.page) || 1;
  const search = awaitedParams.search || '';
  const status = awaitedParams.status || '';
  const type = awaitedParams.type || '';
  const date = awaitedParams.date || '';

  return (
    <div className='mx-auto flex max-w-[1200px] flex-col gap-6'>
      <PageHeader
        eyebrow='Schedule'
        title='Interviews'
        description='Schedule and manage candidate interviews.'
        action={
          <Button asChild>
            <Link href='/dashboard/interviews/new'>
              <PlusIcon className='mr-2 h-4 w-4' />
              Schedule interview
            </Link>
          </Button>
        }
      />

      <div className='flex items-center justify-between space-x-4'>
        <InterviewsSearch />
        <InterviewsFilters />
      </div>

      <Suspense fallback={<Loading />}>
        <InterviewsList
          page={page}
          search={search}
          status={status}
          type={type}
          date={date}
        />
      </Suspense>
    </div>
  );
}
