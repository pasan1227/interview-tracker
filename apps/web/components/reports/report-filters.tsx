'use client';

import { Button } from '@/components/ui/button';
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
import { useUrlFilters } from '@/hooks/use-url-filters';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, FilterIcon, XIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

// react-day-picker only fetched when the popover actually opens.
const Calendar = dynamic(
  () => import('@/components/ui/calendar').then((m) => m.Calendar),
  {
    ssr: false,
    loading: () => <div className='h-72 w-72' aria-hidden />,
  }
);

const KEYS = ['startDate', 'endDate', 'positionId', 'source'] as const;
// Selects use 'All' as a sentinel value (Radix Select can't store '').
const ALL = 'All';

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
  // Reports use a draft+apply pattern: users compose multiple changes locally,
  // then click Apply to push them all to the URL at once.
  const { push, isActive } = useUrlFilters({ keys: KEYS });

  const [date, setDate] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: activeFilters.startDate, to: activeFilters.endDate });
  const [positionId, setPositionId] = useState(activeFilters.positionId || ALL);
  const [source, setSource] = useState(activeFilters.source || ALL);

  // Re-sync local draft state when the URL changes externally (e.g.
  // tab switch). The first-mount pass is a noop because the useState
  // initializers already read from activeFilters — guarding it with a
  // ref avoids a cascading-render warning from React Compiler.
  const didMount = useRef(false);
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    setDate({ from: activeFilters.startDate, to: activeFilters.endDate });
    setPositionId(activeFilters.positionId || ALL);
    setSource(activeFilters.source || ALL);
  }, [activeFilters]);

  const hasActiveFilters =
    isActive ||
    !!(activeFilters.startDate || activeFilters.endDate || activeFilters.positionId || activeFilters.source);

  const applyFilters = () => {
    push({
      startDate: date.from ? format(date.from, 'yyyy-MM-dd') : null,
      endDate: date.to ? format(date.to, 'yyyy-MM-dd') : null,
      positionId: positionId === ALL ? null : positionId,
      source: source === ALL ? null : source,
    });
  };

  const clearFilters = () => {
    setDate({ from: undefined, to: undefined });
    setPositionId(ALL);
    setSource(ALL);
    push({ startDate: null, endDate: null, positionId: null, source: null });
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
                  onSelect={(range) =>
                    setDate({ from: range?.from, to: range?.to })
                  }
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
                <SelectItem value={ALL}>All positions</SelectItem>
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
                <SelectItem value={ALL}>All sources</SelectItem>
                {sources.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
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
