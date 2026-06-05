import { PaginatedDataTable } from '@/components/ui/paginated-data-table';
import { getCandidates } from '@/data/candidate';
import { CandidateColumns } from './candidates-columns';

interface CandidatesListProps {
  page: number;
  search: string;
  status: string;
  position: string;
}

export async function CandidatesList({
  page,
  search,
  status,
  position,
}: CandidatesListProps) {
  const { candidates, totalCandidates, totalPages } = await getCandidates({
    page,
    search,
    status,
    position,
  });

  const isFiltered = Boolean(search || status || position);

  return (
    <PaginatedDataTable
      data={candidates}
      total={totalCandidates}
      itemLabel={{ singular: 'candidate', plural: 'candidates' }}
      columns={CandidateColumns}
      page={page}
      totalPages={totalPages}
      baseUrl='/dashboard/candidates'
      searchParams={{ search, status, position }}
      emptyTitle='No candidates found'
      emptyDescription={
        isFiltered
          ? 'Try changing your filters or search term'
          : 'Create a new candidate to get started'
      }
    />
  );
}
