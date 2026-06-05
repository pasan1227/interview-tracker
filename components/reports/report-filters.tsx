'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, FilterIcon, XIcon } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ReportFiltersProps {
  positions: { id: string; title: string }[];
  sources: string[];
  activeFilters: {
    startDate?: Date;
    endDate?: Date;
    positionId?: string;
    source?: string;
  };
}

export function ReportFilters({
  positions,
  sources,
  activeFilters,
}: ReportFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Local state for date picker
  const [date, setDate] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: activeFilters.startDate,
    to: activeFilters.endDate,
  });

  // Local state for other filters
  const [positionId, setPositionId] = useState(activeFilters.positionId || '');
  const [source, setSource] = useState(activeFilters.source || '');

  // Update local state when active filters change
  useEffect(() => {
    setDate({
      from: activeFilters.startDate,
      to: activeFilters.endDate,
    });
    setPositionId(activeFilters.positionId || '');
    setSource(activeFilters.source || '');
  }, [activeFilters]);

  // Check if any filters are active
  const hasActiveFilters = !!(
    activeFilters.startDate ||
    activeFilters.endDate ||
    activeFilters.positionId ||
    activeFilters.source
  );

  // Apply filters
  const applyFilters = () => {
    // FIX: Create a new URLSearchParams object from the current searchParams
    const params = new URLSearchParams(searchParams.toString());

    // Update date range
    if (date.from) {
      params.set('startDate', format(date.from, 'yyyy-MM-dd'));
    } else {
      params.delete('startDate');
    }

    if (date.to) {
      params.set('endDate', format(date.to, 'yyyy-MM-dd'));
    } else {
      params.delete('endDate');
    }

    // Update position
    if (positionId) {
      params.set('positionId', positionId);
    } else {
      params.delete('positionId');
    }

    // Update source
    if (source) {
      params.set('source', source);
    } else {
      params.delete('source');
    }

    // Preserve the current tab
    const currentTab = searchParams.get('tab');
    if (currentTab) {
      params.set('tab', currentTab);
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  // Clear all filters
  const clearFilters = () => {
    setDate({ from: undefined, to: undefined });
    setPositionId('');
    setSource('');

    // FIX: Create a new URLSearchParams object from the current searchParams
    const params = new URLSearchParams(searchParams.toString());
    params.delete('startDate');
    params.delete('endDate');
    params.delete('positionId');
    params.delete('source');

    // Preserve the current tab
    const currentTab = searchParams.get('tab');
    if (currentTab) {
      params.set('tab', currentTab);
    } else {
      params.delete('tab');
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Card>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle>Report Filters</CardTitle>
            <CardDescription>
              Filter the data to focus on specific metrics
            </CardDescription>
          </div>
          {hasActiveFilters && (
            <Button variant='outline' size='sm' onClick={clearFilters}>
              <XIcon className='mr-2 h-4 w-4' />
              Clear Filters
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <div>
            <label className='block text-sm font-medium mb-1'>Date Range</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !date.from && !date.to && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className='mr-2 h-4 w-4' />
                  {date.from ? (
                    date.to ? (
                      <>
                        {format(date.from, 'LLL dd, y')} -{' '}
                        {format(date.to, 'LLL dd, y')}
                      </>
                    ) : (
                      format(date.from, 'LLL dd, y')
                    )
                  ) : (
                    'Select date range'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-auto p-0' align='start'>
                <Calendar
                  mode='range'
                  selected={{ from: date.from, to: date.to }}
                  onSelect={(range) => {
                    setDate({ from: range?.from, to: range?.to });
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className='block text-sm font-medium mb-1'>Position</label>
            <Select value={positionId} onValueChange={setPositionId}>
              <SelectTrigger>
                <SelectValue placeholder='All positions' />
              </SelectTrigger>
              <SelectContent>
                {/* FIX: Use empty string for "All positions" value */}
                <SelectItem value='All'>All positions</SelectItem>
                {positions.map((position) => (
                  <SelectItem key={position.id} value={position.id}>
                    {position.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className='block text-sm font-medium mb-1'>Source</label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger>
                <SelectValue placeholder='All sources' />
              </SelectTrigger>
              <SelectContent>
                {/* FIX: Use empty string for "All sources" value */}
                <SelectItem value='All'>All sources</SelectItem>
                {sources.map((source) => (
                  <SelectItem key={source} value={source}>
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='flex items-end'>
            <Button className='w-full' onClick={applyFilters}>
              <FilterIcon className='mr-2 h-4 w-4' />
              Apply Filters
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
