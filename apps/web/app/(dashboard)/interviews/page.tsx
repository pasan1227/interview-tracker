// app/(dashboard)/interviews/page.tsx

import { requirePageOrgSession } from '@/lib/authz';
import { PageHeader } from '@/components/dashboard/page-header';
import { InterviewsFilters } from '@/components/interviews/interviews-filters';
import { InterviewsList } from '@/components/interviews/interviews-list';
import { ResourceSearch } from '@/components/ui/resource-search';
import { Button } from '@/components/ui/button';
import { InterviewsSearchParamsSchema } from '@/lib/search-params';
import { PlusIcon } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import Loading from './loading';

interface InterviewsPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function InterviewsPage({
  searchParams,
}: InterviewsPageProps) {
  await requirePageOrgSession();
  const awaitedParams = await searchParams;

  const { page, search, status, type, date } =
    InterviewsSearchParamsSchema.parse(awaitedParams);

  return (
    <div className='mx-auto flex max-w-[1200px] flex-col gap-6'>
      <PageHeader
        eyebrow='Schedule'
        title='Interviews'
        description='Schedule and manage candidate interviews.'
        action={
          <Button asChild>
            <Link href='/interviews/new'>
              <PlusIcon className='mr-2 h-4 w-4' />
              Schedule interview
            </Link>
          </Button>
        }
      />

      <div className='flex items-center justify-between space-x-4'>
        <ResourceSearch placeholder='Search interviews...' />
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
