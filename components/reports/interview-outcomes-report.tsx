'use client';

import { Recommendation } from '@/lib/generated/prisma/browser';
import type { InterviewOutcomeReport } from '@/types/reports';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface InterviewOutcomesReportProps {
  result: InterviewOutcomeReport;
}

const COLORS: Record<Recommendation, string> = {
  STRONG_HIRE: '#22c55e',
  HIRE: '#4ade80',
  NO_DECISION: '#94a3b8',
  NO_HIRE: '#f87171',
  STRONG_NO_HIRE: '#ef4444',
};

export function InterviewOutcomesReport({ result }: InterviewOutcomesReportProps) {
  const data = result.data.map((item) => ({
    ...item,
    recommendation: item.recommendation as Recommendation,
    label: item.recommendation.replace(/_/g, ' '),
  }));

  const feedbackCoverage =
    result.totalInterviews > 0
      ? Math.round((result.interviewsWithFeedback / result.totalInterviews) * 100)
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
        <div className='mb-6 grid gap-4 md:grid-cols-3'>
          <div className='rounded-md bg-secondary p-4'>
            <div className='text-3xl font-bold'>{result.totalInterviews}</div>
            <p className='text-sm text-muted-foreground'>Total interviews</p>
          </div>
          <div className='rounded-md bg-secondary p-4'>
            <div className='text-3xl font-bold'>{result.interviewsWithFeedback}</div>
            <p className='text-sm text-muted-foreground'>Interviews with feedback</p>
          </div>
          <div className='rounded-md bg-secondary p-4'>
            <div className='text-3xl font-bold'>{feedbackCoverage}%</div>
            <p className='text-sm text-muted-foreground'>Feedback coverage</p>
          </div>
        </div>

        {result.totalFeedback === 0 ? (
          <div className='flex h-80 items-center justify-center'>
            <p className='text-muted-foreground'>
              No feedback data available for the selected filters
            </p>
          </div>
        ) : (
          <div className='grid gap-6 md:grid-cols-2'>
            <div className='h-80'>
              <h3 className='mb-4 text-center text-sm font-medium'>
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
                      return p > 0.05 ? `${name} (${(p * 100).toFixed(0)}%)` : '';
                    }}
                    labelLine={false}
                  >
                    {data.map((entry) => (
                      <Cell
                        key={entry.recommendation}
                        fill={COLORS[entry.recommendation] ?? '#9ca3af'}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} feedback`, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className='h-80'>
              <h3 className='mb-4 text-center text-sm font-medium'>
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
                  <Tooltip formatter={(value) => [`${value} feedback`, 'Count']} />
                  <Bar dataKey='count' name='Count'>
                    {data.map((entry) => (
                      <Cell
                        key={entry.recommendation}
                        fill={COLORS[entry.recommendation] ?? '#9ca3af'}
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
              className='flex justify-between rounded-md border p-3'
              style={{
                borderLeftColor: COLORS[item.recommendation] ?? '#9ca3af',
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
