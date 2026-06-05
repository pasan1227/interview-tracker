'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ReportFilters, MonthlyHireData } from '@/types/reports';
import { getMonthlyHiresReport } from '@/actions/reports';
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
  filters: ReportFilters;
}

export function MonthlyHiresReport({ filters }: MonthlyHiresReportProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<MonthlyHireData[]>([]);
  const [totalHires, setTotalHires] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const result = await getMonthlyHiresReport(filters);
        setData(result.data);
        setTotalHires(result.totalHires);
      } catch (error) {
        console.error('Error fetching monthly hires data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Hires</CardTitle>
        <CardDescription>Number of candidates hired per month</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='mb-6'>
          <div className='p-4 bg-slate-50 rounded-md inline-block'>
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
                data={data}
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
          {data.map((item) => (
            <div
              key={item.month}
              className='flex justify-between p-3 border rounded-md'
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
