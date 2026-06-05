// components/candidates/candidates-filters.tsx

'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePositions } from '@/hooks/use-positions';
import { CandidateStatus } from '@/lib/generated/prisma/browser';
import { FilterIcon } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

export function CandidatesFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const { positions, isLoading } = usePositions();

  const currentStatus = searchParams.get('status') || '';
  const currentPosition = searchParams.get('position') || '';

  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams(searchParams);

    if (value) {
      params.set('status', value);
    } else {
      params.delete('status');
    }

    // Reset to first page when filtering
    params.delete('page');

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handlePositionChange = (value: string) => {
    const params = new URLSearchParams(searchParams);

    if (value) {
      params.set('position', value);
    } else {
      params.delete('position');
    }

    // Reset to first page when filtering
    params.delete('page');

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleClearFilters = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('status');
    params.delete('position');
    params.delete('page');

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const isFiltered = currentStatus || currentPosition;

  return (
    <div className='flex items-center gap-2'>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='outline' size='sm'>
            <FilterIcon className='mr-2 h-4 w-4' />
            Filters
            {isFiltered && <span className='ml-1 text-xs'>(Active)</span>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-56'>
          <DropdownMenuLabel>Status</DropdownMenuLabel>
          <DropdownMenuCheckboxItem
            checked={!currentStatus}
            onCheckedChange={() => handleStatusChange('')}
          >
            All Statuses
          </DropdownMenuCheckboxItem>
          {Object.values(CandidateStatus).map((status) => (
            <DropdownMenuCheckboxItem
              key={status}
              checked={currentStatus === status}
              onCheckedChange={() => handleStatusChange(status)}
            >
              {status.replace(/_/g, ' ')}
            </DropdownMenuCheckboxItem>
          ))}

          <DropdownMenuSeparator />

          <DropdownMenuLabel>Position</DropdownMenuLabel>
          <DropdownMenuCheckboxItem
            checked={!currentPosition}
            onCheckedChange={() => handlePositionChange('')}
          >
            All Positions
          </DropdownMenuCheckboxItem>
          {isLoading ? (
            <DropdownMenuCheckboxItem disabled>
              Loading positions...
            </DropdownMenuCheckboxItem>
          ) : (
            positions.map((position) => (
              <DropdownMenuCheckboxItem
                key={position.id}
                checked={currentPosition === position.id}
                onCheckedChange={() => handlePositionChange(position.id)}
              >
                {position.title}
              </DropdownMenuCheckboxItem>
            ))
          )}

          {isFiltered && (
            <>
              <DropdownMenuSeparator />
              <div className='p-2'>
                <Button
                  variant='outline'
                  size='sm'
                  className='w-full'
                  onClick={handleClearFilters}
                  disabled={isPending}
                >
                  Clear Filters
                </Button>
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
