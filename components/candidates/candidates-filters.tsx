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
import { useUrlFilters } from '@/hooks/use-url-filters';
import { CandidateStatus } from '@/lib/generated/prisma/browser';
import { FilterIcon } from 'lucide-react';

const KEYS = ['status', 'position'] as const;
const RESET = ['page'] as const;

export function CandidatesFilters() {
  const { get, push, clear, isActive, isPending } = useUrlFilters({
    keys: KEYS,
    resetKeys: RESET,
  });
  const { positions, isLoading } = usePositions();

  const currentStatus = get('status');
  const currentPosition = get('position');

  return (
    <div className='flex items-center gap-2'>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='outline' size='sm'>
            <FilterIcon className='mr-2 h-4 w-4' />
            Filters
            {isActive && <span className='ml-1 text-xs'>(Active)</span>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-56'>
          <DropdownMenuLabel>Status</DropdownMenuLabel>
          <DropdownMenuCheckboxItem
            checked={!currentStatus}
            onCheckedChange={() => push({ status: null })}
          >
            All Statuses
          </DropdownMenuCheckboxItem>
          {Object.values(CandidateStatus).map((status) => (
            <DropdownMenuCheckboxItem
              key={status}
              checked={currentStatus === status}
              onCheckedChange={() => push({ status })}
            >
              {status.replace(/_/g, ' ')}
            </DropdownMenuCheckboxItem>
          ))}

          <DropdownMenuSeparator />

          <DropdownMenuLabel>Position</DropdownMenuLabel>
          <DropdownMenuCheckboxItem
            checked={!currentPosition}
            onCheckedChange={() => push({ position: null })}
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
                onCheckedChange={() => push({ position: position.id })}
              >
                {position.title}
              </DropdownMenuCheckboxItem>
            ))
          )}

          {isActive && (
            <>
              <DropdownMenuSeparator />
              <div className='p-2'>
                <Button
                  variant='outline'
                  size='sm'
                  className='w-full'
                  onClick={clear}
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
