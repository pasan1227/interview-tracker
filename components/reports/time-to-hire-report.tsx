'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CHART_INFO } from '@/lib/constants/chart-palette';
import type { TimeToHireReport as TimeToHireReportData } from '@/types/reports';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface TimeToHireReportProps {
  result: TimeToHireReportData;
}

export function TimeToHireReport({ result }: TimeToHireReportProps) {
  const sortedData = [...result.positionAverages].sort(
    (a, b) => a.avgDays - b.avgDays
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Time to Hire Analysis</CardTitle>
        <CardDescription>
          Average days from candidate creation to hired status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='mb-6 grid gap-4 md:grid-cols-2'>
          <div className='rounded-md bg-secondary p-4'>
            <div className='text-3xl font-bold'>{result.avgTimeToHire} days</div>
            <p className='text-sm text-muted-foreground'>
              Overall average time to hire
            </p>
          </div>
          <div className='rounded-md bg-secondary p-4'>
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
                data={sortedData}
                layout='vertical'
                margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis
                  type='number'
                  label={{ value: 'Days', position: 'insideBottom', offset: -5 }}
                />
                <YAxis
                  dataKey='position'
                  type='category'
                  width={100}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value) => [`${value} days`, 'Avg. Time to Hire']}
                  labelFormatter={(label) => `Position: ${label}`}
                />
                <Bar dataKey='avgDays' fill={CHART_INFO}>
                  <LabelList
                    dataKey='avgDays'
                    position='right'
                    formatter={(value) => `${value} days`}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className='mt-4'>
          <h3 className='mb-2 font-medium'>Position Breakdown</h3>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {sortedData.map((item) => (
              <div
                key={item.position}
                className='flex justify-between rounded-md border p-3'
              >
                <div>
                  <p className='font-medium'>{item.position}</p>
                  <p className='text-xs text-muted-foreground'>{item.count} hires</p>
                </div>
                <span className='font-bold'>{item.avgDays} days</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
