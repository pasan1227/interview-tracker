'use client';

import { getCandidateStatusReport } from '@/actions/reports';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CandidateStatusData, ReportFilters } from '@/data/reports';
import { useEffect, useState } from 'react';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface CandidateStatusReportProps {
  filters: ReportFilters;
}

interface FormattedStatusData extends CandidateStatusData {
  label: string;
}

export function CandidateStatusReport({ filters }: CandidateStatusReportProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<FormattedStatusData[]>([]);
  const [totalCandidates, setTotalCandidates] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const result = await getCandidateStatusReport(filters);

        // Format status labels
        const formattedData = result.data.map((item) => ({
          ...item,
          label: item.status.replace(/_/g, ' '),
        }));

        setData(formattedData);
        setTotalCandidates(result.totalCandidates);
      } catch (error) {
        console.error('Error fetching candidate status data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  // Colors for the chart
  const COLORS = [
    '#3b82f6', // NEW - blue
    '#f59e0b', // IN_PROCESS - amber
    '#a855f7', // OFFERED - purple
    '#22c55e', // HIRED - green
    '#ef4444', // REJECTED - red
    '#6b7280', // WITHDRAWN - gray
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Candidate Status Distribution</CardTitle>
        <CardDescription>
          Overview of candidates by their current status
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
                  data={data}
                  cx='50%'
                  cy='50%'
                  outerRadius={150}
                  dataKey='count'
                  nameKey='label'
                  label={({ name, value, percent }) =>
                    value > 0
                      ? `${name}: ${value} (${((percent ?? 0) * 100).toFixed(0)}%)`
                      : ''
                  }
                  labelLine={false}
                >
                  {data.map((entry, index) => (
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

        <div className='mt-4 grid gap-4 md:grid-cols-3'>
          {data.map((item) => (
            <div
              key={item.status}
              className='flex justify-between p-3 border rounded-md'
            >
              <span className='font-medium'>{item.label}</span>
              <span>{item.count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
