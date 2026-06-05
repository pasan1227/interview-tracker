'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ReportFilters, SourceData } from '@/data/reports';
import { getSourceReport } from '@/actions/reports';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface SourcesReportProps {
  filters: ReportFilters;
}

export function SourcesReport({ filters }: SourcesReportProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<SourceData[]>([]);
  const [totalCandidates, setTotalCandidates] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const result = await getSourceReport(filters);
        setData(result.data);
        setTotalCandidates(result.totalCandidates);
      } catch (error) {
        console.error('Error fetching source data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  // Only show top 10 sources for readability
  const topSources = data.slice(0, 10);

  // Colors for the chart
  const COLORS = [
    '#3b82f6',
    '#22c55e',
    '#f59e0b',
    '#a855f7',
    '#ef4444',
    '#0ea5e9',
    '#10b981',
    '#f97316',
    '#8b5cf6',
    '#6b7280',
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Candidate Sources</CardTitle>
        <CardDescription>
          Distribution of candidates by recruitment source
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className='flex justify-center items-center h-80'>
            <p className='text-muted-foreground'>Loading...</p>
          </div>
        ) : totalCandidates === 0 ? (
          <div className='flex justify-center items-center h-80'>
            <p className='text-muted-foreground'>
              No data available for the selected filters
            </p>
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
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} Candidates`, name]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className='mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {topSources.map((item) => (
            <div
              key={item.source}
              className='flex justify-between p-3 border rounded-md'
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
