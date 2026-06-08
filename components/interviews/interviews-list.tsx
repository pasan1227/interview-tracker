import { PaginatedDataTable } from '@/components/ui/paginated-data-table';
import { getInterviews } from '@/data/interview';
import { requireOrgSession, toOrgContext } from '@/lib/authz';
import { parseDateFilter } from '@/lib/parse-date-filter';
import { InterviewColumns } from './interviews-columns';

interface InterviewsListProps {
  page: number;
  search: string;
  status: string;
  type: string;
  date: string;
}

export async function InterviewsList({
  page,
  search,
  status,
  type,
  date,
}: InterviewsListProps) {
  const { dateFrom, dateTo } = parseDateFilter(date);
  const user = await requireOrgSession();

  const { items, total, totalPages } = await getInterviews(toOrgContext(user), {
    page,
    search,
    status,
    type,
    dateFrom,
    dateTo,
  });

  const isFiltered = Boolean(search || status || type || date);

  return (
    <PaginatedDataTable
      data={items}
      total={total}
      itemLabel={{ singular: 'interview', plural: 'interviews' }}
      columns={InterviewColumns}
      page={page}
      totalPages={totalPages}
      baseUrl='/dashboard/interviews'
      searchParams={{ search, status, type, date }}
      emptyTitle='No interviews found'
      emptyDescription={
        isFiltered
          ? 'Try changing your filters or search term'
          : 'Schedule an interview to get started'
      }
    />
  );
}
