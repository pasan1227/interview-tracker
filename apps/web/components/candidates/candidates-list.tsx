import { PaginatedDataTable } from '@/components/ui/paginated-data-table';
import { getCandidates } from '@/data/candidate';
import { requireOrgSession, toOrgContext } from '@/lib/authz';
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
  const user = await requireOrgSession();
  const ctx = toOrgContext(user);
  const { items, total, totalPages } = await getCandidates(ctx, {
    page,
    search,
    status,
    position,
  });

  const isFiltered = Boolean(search || status || position);

  return (
    <PaginatedDataTable
      data={items}
      total={total}
      itemLabel={{ singular: 'candidate', plural: 'candidates' }}
      columns={CandidateColumns}
      page={page}
      totalPages={totalPages}
      baseUrl='/candidates'
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
