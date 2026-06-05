'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { SourceReport } from '@/types/reports';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface SourcesReportProps {
  result: SourceReport;
}

const COLORS = [
  '#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ef4444',
  '#0ea5e9', '#10b981', '#f97316', '#8b5cf6', '#6b7280',
];

export function SourcesReport({ result }: SourcesReportProps) {
  const topSources = result.data.slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Candidate Sources</CardTitle>
        <CardDescription>
          Distribution of candidates by recruitment source
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
              <PieChart>
                <Pie
                  data={topSources}
                  cx='50%'
                  cy='50%'
                  outerRadius={150}
                  dataKey='count'
                  nameKey='source'
                  label={({ name, value, percent }) =>
                    value > 0
                      ? `${name}: ${value} (${((percent ?? 0) * 100).toFixed(0)}%)`
                      : ''
                  }
                  labelLine={false}
                >
                  {topSources.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} Candidates`, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className='mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {topSources.map((item) => (
            <div
              key={item.source}
              className='flex justify-between rounded-md border p-3'
            >
              <span className='font-medium'>{item.source}</span>
              <span>{item.count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
