'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {  ReportFilters } from '@/types/reports';
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
import { getTimeToHireReport } from '@/actions/reports';

interface TimeToHireReportProps {
  filters: ReportFilters;
}

interface PositionAverageData {
  position: string;
  avgDays: number;
  count: number;
}

export function TimeToHireReport({ filters }: TimeToHireReportProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [avgTimeToHire, setAvgTimeToHire] = useState(0);
  const [positionAverages, setPositionAverages] = useState<
    PositionAverageData[]
  >([]);
  const [totalHires, setTotalHires] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const result = await getTimeToHireReport(filters);
        setAvgTimeToHire(result.avgTimeToHire);
        setPositionAverages(result.positionAverages);
        setTotalHires(result.totalHires);
      } catch (error) {
        console.error('Error fetching time-to-hire data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  // Sort by average days (ascending)
  const sortedData = [...positionAverages].sort(
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
        <div className='grid gap-4 mb-6 md:grid-cols-2'>
          <div className='p-4 bg-slate-50 rounded-md'>
            <div className='text-3xl font-bold'>
              {isLoading ? '...' : `${avgTimeToHire} days`}
            </div>
            <p className='text-sm text-muted-foreground'>
              Overall average time to hire
            </p>
          </div>
          <div className='p-4 bg-slate-50 rounded-md'>
            <div className='text-3xl font-bold'>
              {isLoading ? '...' : totalHires}
            </div>
            <p className='text-sm text-muted-foreground'>
              Total hires in period
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className='flex justify-center items-center h-80'>
            <p className='text-muted-foreground'>Loading...</p>
          </div>
        ) : totalHires === 0 ? (
          <div className='flex justify-center items-center h-80'>
            <p className='text-muted-foreground'>
              No data available for the selected filters
            </p>
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
                  label={{
                    value: 'Days',
                    position: 'insideBottom',
                    offset: -5,
                  }}
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
                <Bar dataKey='avgDays' fill='#3b82f6'>
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
          <h3 className='font-medium mb-2'>Position Breakdown</h3>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {sortedData.map((item) => (
              <div
                key={item.position}
                className='flex justify-between p-3 border rounded-md'
              >
                <div>
                  <p className='font-medium'>{item.position}</p>
                  <p className='text-xs text-muted-foreground'>
                    {item.count} hires
                  </p>
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
