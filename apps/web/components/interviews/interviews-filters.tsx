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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { InterviewStatus, InterviewType } from '@/lib/generated/prisma/browser';
import { format } from 'date-fns';
import { CalendarIcon, FilterIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { DateRange } from 'react-day-picker';

// react-day-picker is ~30KB. Only fetch it when the popover actually opens.
const Calendar = dynamic(
  () => import('@/components/ui/calendar').then((m) => m.Calendar),
  {
    ssr: false,
    loading: () => <div className='h-72 w-[36rem]' aria-hidden />,
  }
);

const KEYS = ['status', 'type', 'date'] as const;
const RESET = ['page'] as const;

const DATE_PRESETS = [
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'this-week', label: 'This Week' },
  { value: 'next-week', label: 'Next Week' },
] as const;

export function InterviewsFilters() {
  const { get, push, clear, isActive, isPending } = useUrlFilters({
    keys: KEYS,
    resetKeys: RESET,
  });
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const currentStatus = get('status');
  const currentType = get('type');
  const currentDate = get('date');

  const handleDateRangeApply = () => {
    if (!dateRange?.from) return;
    const from = format(dateRange.from, 'yyyy-MM-dd');
    const to = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : from;
    push({ date: `${from}|${to}` });
  };

  const handleClear = () => {
    setDateRange(undefined);
    clear();
  };

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
          {Object.values(InterviewStatus).map((status) => (
            <DropdownMenuCheckboxItem
              key={status}
              checked={currentStatus === status}
              onCheckedChange={() => push({ status })}
            >
              {status.replace(/_/g, ' ')}
            </DropdownMenuCheckboxItem>
          ))}

          <DropdownMenuSeparator />

          <DropdownMenuLabel>Type</DropdownMenuLabel>
          <DropdownMenuCheckboxItem
            checked={!currentType}
            onCheckedChange={() => push({ type: null })}
          >
            All Types
          </DropdownMenuCheckboxItem>
          {Object.values(InterviewType).map((type) => (
            <DropdownMenuCheckboxItem
              key={type}
              checked={currentType === type}
              onCheckedChange={() => push({ type })}
            >
              {type.replace(/_/g, ' ')}
            </DropdownMenuCheckboxItem>
          ))}

          <DropdownMenuSeparator />

          <DropdownMenuLabel>Date</DropdownMenuLabel>
          <DropdownMenuCheckboxItem
            checked={!currentDate}
            onCheckedChange={() => push({ date: null })}
          >
            All Dates
          </DropdownMenuCheckboxItem>
          {DATE_PRESETS.map((preset) => (
            <DropdownMenuCheckboxItem
              key={preset.value}
              checked={currentDate === preset.value}
              onCheckedChange={() => push({ date: preset.value })}
            >
              {preset.label}
            </DropdownMenuCheckboxItem>
          ))}

          {isActive && (
            <>
              <DropdownMenuSeparator />
              <div className='p-2'>
                <Button
                  variant='outline'
                  size='sm'
                  className='w-full'
                  onClick={handleClear}
                  disabled={isPending}
                >
                  Clear Filters
                </Button>
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant='outline' size='sm'>
            <CalendarIcon className='mr-2 h-4 w-4' />
            Date Range
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-auto p-0' align='end'>
          <Calendar
            mode='range'
            selected={dateRange}
            onSelect={setDateRange}
            numberOfMonths={2}
          />
          <div className='border-t p-3 flex justify-end space-x-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setDateRange(undefined)}
            >
              Clear
            </Button>
            <Button
              size='sm'
              onClick={handleDateRangeApply}
              disabled={!dateRange?.from || isPending}
            >
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
