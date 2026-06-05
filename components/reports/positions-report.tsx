'use client';

import { useEffect, useState } from 'react';
import {  ReportFilters } from '@/types/reports';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import { getPositionReport } from '@/actions/reports';

interface PositionsReportProps {
  filters: ReportFilters;
}

interface PositionData {
  position: string;
  count: number;
}

export function PositionsReport({ filters }: PositionsReportProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<PositionData[]>([]);
  const [totalCandidates, setTotalCandidates] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const result = await getPositionReport(filters);
        setData(result.data);
        setTotalCandidates(result.totalCandidates);
      } catch (error) {
        console.error('Error fetching position data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  // Only show top 10 positions for readability
  const topPositions = data.slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Candidates by Position</CardTitle>
        <CardDescription>
          Distribution of candidates across different job positions
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
              className='flex justify-between p-3 border rounded-md'
            >
              <span
                className='font-medium truncate max-w-[70%]'
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
