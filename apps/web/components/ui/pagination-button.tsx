// components/ui/pagination-button.tsx

'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

interface PaginationButtonProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  searchParams?: Record<string, string>;
}

export function PaginationButton({
  currentPage,
  totalPages,
  baseUrl,
  searchParams = {},
}: PaginationButtonProps) {
  const createPageUrl = (page: number) => {
    const params = new URLSearchParams();

    // Add current search params
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    // Set the page param
    params.set('page', String(page));

    return `${baseUrl}?${params.toString()}`;
  };

  return (
    <div className='flex items-center space-x-2'>
      <Button variant='outline' size='icon' asChild disabled={currentPage <= 1}>
        <Link
          href={currentPage > 1 ? createPageUrl(currentPage - 1) : '#'}
          aria-label='Previous page'
        >
          <ChevronLeftIcon className='h-4 w-4' />
        </Link>
      </Button>
      <div className='text-sm'>
        Page {currentPage} of {totalPages}
      </div>
      <Button
        variant='outline'
        size='icon'
        asChild
        disabled={currentPage >= totalPages}
      >
        <Link
          href={currentPage < totalPages ? createPageUrl(currentPage + 1) : '#'}
          aria-label='Next page'
        >
          <ChevronRightIcon className='h-4 w-4' />
        </Link>
      </Button>
    </div>
  );
}
