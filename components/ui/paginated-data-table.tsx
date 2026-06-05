import { DataTable } from '@/components/ui/data-table';
import { ListEmptyState } from '@/components/ui/list-empty-state';
import { PaginationButton } from '@/components/ui/pagination-button';
import type { ColumnDef } from '@tanstack/react-table';

interface PaginatedDataTableProps<TData, TValue> {
  /** Row data for this page. */
  data: TData[];
  /** Total count across all pages (renders the "{n} {label} found" line). */
  total: number;
  /** Singular/plural noun for the count line, e.g. "candidate" / "candidates". */
  itemLabel: { singular: string; plural: string };
  /** Column defs passed straight to DataTable. */
  columns: ColumnDef<TData, TValue>[];
  /** Pagination state. */
  page: number;
  totalPages: number;
  /** Base URL for pagination links. */
  baseUrl: string;
  /** Filter/search params to preserve in pagination links. */
  searchParams?: Record<string, string>;
  /** Empty state copy. */
  emptyTitle: string;
  emptyDescription: string;
}

export function PaginatedDataTable<TData, TValue>({
  data,
  total,
  itemLabel,
  columns,
  page,
  totalPages,
  baseUrl,
  searchParams,
  emptyTitle,
  emptyDescription,
}: PaginatedDataTableProps<TData, TValue>) {
  return (
    <div className='space-y-4'>
      <DataTable
        data={data}
        columns={columns}
        emptyState={
          <ListEmptyState title={emptyTitle} description={emptyDescription} />
        }
      />

      {totalPages > 1 && (
        <div className='flex justify-end'>
          <PaginationButton
            currentPage={page}
            totalPages={totalPages}
            baseUrl={baseUrl}
            searchParams={searchParams}
          />
        </div>
      )}

      <div className='text-xs text-muted-foreground'>
        {total} {total === 1 ? itemLabel.singular : itemLabel.plural} found
      </div>
    </div>
  );
}
