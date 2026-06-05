'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CANDIDATE_STATUS_CHART_COLORS, CHART_NEUTRAL } from '@/lib/constants/chart-palette';
import type { CandidateStatus } from '@/lib/generated/prisma/browser';
import type { CandidateStatusReport as CandidateStatusReportData } from '@/types/reports';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface CandidateStatusReportProps {
  result: CandidateStatusReportData;
}

// Server fetches the result via @/actions/reports.getCandidateStatusReport
// and passes it in. This component is purely the recharts shell — the
// previous client-side useEffect → action → setState round-trip is gone.
export function CandidateStatusReport({ result }: CandidateStatusReportProps) {
  const data = result.data.map((item) => ({
    ...item,
    label: item.status.replace(/_/g, ' '),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Candidate Status Distribution</CardTitle>
        <CardDescription>
          Overview of candidates by their current status
        </CardDescription>
      </CardHeader>
      <CardContent>
        {result.totalCandidates === 0 ? (
          <EmptyState />
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
                      fill={
                        CANDIDATE_STATUS_CHART_COLORS[
                          entry.status as CandidateStatus
                        ] ?? CHART_NEUTRAL
                      }
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} Candidates`, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className='mt-4 grid gap-4 md:grid-cols-3'>
          {data.map((item) => (
            <div
              key={item.status}
              className='flex justify-between rounded-md border p-3'
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

function EmptyState() {
  return (
    <div className='flex h-80 items-center justify-center'>
      <p className='text-muted-foreground'>No data available for the selected filters</p>
    </div>
  );
}
