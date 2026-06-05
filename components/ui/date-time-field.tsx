'use client';

import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

// react-day-picker (~30KB) only loads when the popover opens.
const Calendar = dynamic(
  () => import('@/components/ui/calendar').then((m) => m.Calendar),
  {
    ssr: false,
    loading: () => <div className='h-72 w-72' aria-hidden />,
  }
);

interface DateTimeFieldProps<TForm extends FieldValues> {
  control: Control<TForm>;
  name: FieldPath<TForm>;
  label: string;
}

/**
 * A react-hook-form-bound date + time picker. Wraps a calendar popover and a
 * `<input type="time">` so users can pick day and time in one field while the
 * form stores a single Date value.
 */
export function DateTimeField<TForm extends FieldValues>({
  control,
  name,
  label,
}: DateTimeFieldProps<TForm>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const value = field.value as Date;
        const setDatePart = (date: Date | undefined) => {
          if (!date) return;
          const next = new Date(value);
          next.setFullYear(date.getFullYear());
          next.setMonth(date.getMonth());
          next.setDate(date.getDate());
          field.onChange(next);
        };
        const setTimePart = (time: string) => {
          const [hours, minutes] = time.split(':').map(Number);
          const next = new Date(value);
          next.setHours(hours);
          next.setMinutes(minutes);
          field.onChange(next);
        };

        return (
          <FormItem className='flex flex-col'>
            <FormLabel>{label}</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant='outline'
                    className={cn(
                      'w-full pl-3 text-left font-normal',
                      !value && 'text-muted-foreground'
                    )}
                  >
                    {value ? (
                      format(value, 'PPP p')
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className='w-auto p-0' align='start'>
                <Calendar mode='single' selected={value} onSelect={setDatePart} />
                <div className='border-t p-3'>
                  <div className='flex justify-between items-center'>
                    <label className='text-sm'>Time:</label>
                    <Input
                      type='time'
                      className='w-40'
                      value={format(value, 'HH:mm')}
                      onChange={(e) => setTimePart(e.target.value)}
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
