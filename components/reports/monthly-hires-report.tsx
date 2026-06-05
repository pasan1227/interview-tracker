'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { MonthlyHiresReport as MonthlyHiresReportData } from '@/types/reports';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface MonthlyHiresReportProps {
  result: MonthlyHiresReportData;
}

export function MonthlyHiresReport({ result }: MonthlyHiresReportProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Hires</CardTitle>
        <CardDescription>Number of candidates hired per month</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='mb-6'>
          <div className='inline-block rounded-md bg-secondary p-4'>
            <div className='text-3xl font-bold'>{result.totalHires}</div>
            <p className='text-sm text-muted-foreground'>Total hires in period</p>
          </div>
        </div>

        {result.totalHires === 0 ? (
          <div className='flex h-80 items-center justify-center'>
            <p className='text-muted-foreground'>No data available for the selected filters</p>
          </div>
        ) : (
          <div className='h-96'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart
                data={result.data}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='month' />
                <YAxis allowDecimals={false} />
                <Tooltip
                  formatter={(value) => [`${value} hires`, 'Hires']}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Bar dataKey='count' name='Hires' fill='#22c55e' />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className='mt-4 grid gap-4 md:grid-cols-3 lg:grid-cols-4'>
          {result.data.map((item) => (
            <div
              key={item.month}
              className='flex justify-between rounded-md border p-3'
            >
              <span className='font-medium'>{item.month}</span>
              <span>{item.count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
