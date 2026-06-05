'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { PositionReport } from '@/types/reports';
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

interface PositionsReportProps {
  result: PositionReport;
}

export function PositionsReport({ result }: PositionsReportProps) {
  const topPositions = result.data.slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Candidates by Position</CardTitle>
        <CardDescription>
          Distribution of candidates across different job positions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {result.totalCandidates === 0 ? (
          <div className='flex h-80 items-center justify-center'>
            <p className='text-muted-foreground'>No data available for the selected filters</p>
          </div>
        ) : (
          <div className='h-96'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart
                data={topPositions}
                layout='vertical'
                margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis type='number' />
                <YAxis
                  dataKey='position'
                  type='category'
                  width={100}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value) => [`${value} candidates`, 'Count']}
                  labelFormatter={(label) => `Position: ${label}`}
                />
                <Bar dataKey='count' fill='#3b82f6'>
                  <LabelList dataKey='count' position='right' />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className='mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {topPositions.map((item) => (
            <div
              key={item.position}
              className='flex justify-between rounded-md border p-3'
            >
              <span
                className='max-w-[70%] truncate font-medium'
                title={item.position}
              >
                {item.position}
              </span>
              <span>{item.count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
