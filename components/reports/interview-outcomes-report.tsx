'use client';

import { useEffect, useState } from 'react';
import { Recommendation } from '@/lib/generated/prisma/browser';
import { ReportFilters } from '@/types/reports';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  PieChart,
  Pie,
  ResponsiveContainer,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { getInterviewOutcomeReport } from '@/actions/reports';

interface InterviewOutcomesReportProps {
  filters: ReportFilters;
}

interface OutcomeData {
  recommendation: Recommendation;
  count: number;
  label?: string;
}

export function InterviewOutcomesReport({
  filters,
}: InterviewOutcomesReportProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<OutcomeData[]>([]);
  const [totalFeedback, setTotalFeedback] = useState(0);
  const [totalInterviews, setTotalInterviews] = useState(0);
  const [interviewsWithFeedback, setInterviewsWithFeedback] = useState(0);
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const result = await getInterviewOutcomeReport(filters);
        
        // Format recommendation labels
        const formattedData = result.data.map((item) => ({
          ...item,
          recommendation: item.recommendation as Recommendation,
          label: item.recommendation.replace(/_/g, ' '),
        }));
        
        setData(formattedData);
        setTotalFeedback(result.totalFeedback);
        setTotalInterviews(result.totalInterviews);
        setInterviewsWithFeedback(result.interviewsWithFeedback);
      } catch (error) {
        console.error('Error fetching interview outcomes data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  // Colors for the chart
  const COLORS = {
    STRONG_HIRE: '#22c55e', // green
    HIRE: '#4ade80', // light green
    NO_DECISION: '#94a3b8', // slate
    NO_HIRE: '#f87171', // light red
    STRONG_NO_HIRE: '#ef4444', // red
  };

  // Calculate feedback coverage
  const feedbackCoverage =
    totalInterviews > 0
      ? Math.round((interviewsWithFeedback / totalInterviews) * 100)
      : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Interview Outcomes</CardTitle>
        <CardDescription>
          Distribution of feedback recommendations from completed interviews
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='grid gap-4 mb-6 md:grid-cols-3'>
          <div className='p-4 bg-slate-50 rounded-md'>
            <div className='text-3xl font-bold'>
              {isLoading ? '...' : totalInterviews}
            </div>
            <p className='text-sm text-muted-foreground'>Total interviews</p>
          </div>
          <div className='p-4 bg-slate-50 rounded-md'>
            <div className='text-3xl font-bold'>
              {isLoading ? '...' : interviewsWithFeedback}
            </div>
            <p className='text-sm text-muted-foreground'>
              Interviews with feedback
            </p>
          </div>
          <div className='p-4 bg-slate-50 rounded-md'>
            <div className='text-3xl font-bold'>
              {isLoading ? '...' : `${feedbackCoverage}%`}
            </div>
            <p className='text-sm text-muted-foreground'>Feedback coverage</p>
          </div>
        </div>

        {isLoading ? (
          <div className='flex justify-center items-center h-80'>
            <p className='text-muted-foreground'>Loading...</p>
          </div>
        ) : totalFeedback === 0 ? (
          <div className='flex justify-center items-center h-80'>
            <p className='text-muted-foreground'>
              No feedback data available for the selected filters
            </p>
          </div>
        ) : (
          <div className='grid gap-6 md:grid-cols-2'>
            <div className='h-80'>
              <h3 className='text-sm font-medium mb-4 text-center'>
                Recommendation Distribution
              </h3>
              <ResponsiveContainer width='100%' height='100%'>
                <PieChart>
                  <Pie
                    data={data}
                    cx='50%'
                    cy='50%'
                    outerRadius={100}
                    dataKey='count'
                    nameKey='label'
                    label={({ name, percent }) => {
                      const p = percent ?? 0;
                      return p > 0.05
                        ? `${name} (${(p * 100).toFixed(0)}%)`
                        : '';
                    }}
                    labelLine={false}
                  >
                    {data.map((entry) => (
                      <Cell
                        key={entry.recommendation}
                        fill={COLORS[entry.recommendation] || '#9ca3af'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${value} feedback`, name]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className='h-80'>
              <h3 className='text-sm font-medium mb-4 text-center'>
                Recommendation Counts
              </h3>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart
                  data={data}
                  layout='vertical'
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis type='number' />
                  <YAxis
                    dataKey='label'
                    type='category'
                    width={100}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value) => [`${value} feedback`, 'Count']}
                  />
                  <Bar dataKey='count' name='Count'>
                    {data.map((entry) => (
                      <Cell
                        key={entry.recommendation}
                        fill={COLORS[entry.recommendation] || '#9ca3af'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className='mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {data.map((item) => (
            <div
              key={item.recommendation}
              className='flex justify-between p-3 border rounded-md'
              style={{
                borderLeftColor: COLORS[item.recommendation] || '#9ca3af',
                borderLeftWidth: 4,
              }}
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