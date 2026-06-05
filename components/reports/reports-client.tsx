'use client';

import { ReportFilters } from '@/components/reports/report-filters';
import { ReportSkeleton } from '@/components/reports/report-skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ReportFilters as ReportFiltersType } from '@/data/reports';
import dynamic from 'next/dynamic';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

// Each report ships its own recharts payload; load them lazily so opening
// the page only pays for the active tab. ssr:false because recharts is
// client-only and would otherwise dual-render. (Next requires the options
// object to be an inline literal — that's why the same shape is duplicated.)
const CandidateStatusReport = dynamic(
  () =>
    import('@/components/reports/candidate-status-report').then((m) => ({
      default: m.CandidateStatusReport,
    })),
  { ssr: false, loading: () => <ReportSkeleton /> }
);
const SourcesReport = dynamic(
  () =>
    import('@/components/reports/sources-report').then((m) => ({
      default: m.SourcesReport,
    })),
  { ssr: false, loading: () => <ReportSkeleton /> }
);
const PositionsReport = dynamic(
  () =>
    import('@/components/reports/positions-report').then((m) => ({
      default: m.PositionsReport,
    })),
  { ssr: false, loading: () => <ReportSkeleton /> }
);
const TimeToHireReport = dynamic(
  () =>
    import('@/components/reports/time-to-hire-report').then((m) => ({
      default: m.TimeToHireReport,
    })),
  { ssr: false, loading: () => <ReportSkeleton /> }
);
const InterviewOutcomesReport = dynamic(
  () =>
    import('@/components/reports/interview-outcomes-report').then((m) => ({
      default: m.InterviewOutcomesReport,
    })),
  { ssr: false, loading: () => <ReportSkeleton /> }
);
const MonthlyHiresReport = dynamic(
  () =>
    import('@/components/reports/monthly-hires-report').then((m) => ({
      default: m.MonthlyHiresReport,
    })),
  { ssr: false, loading: () => <ReportSkeleton /> }
);

interface ReportsClientProps {
  positions: { id: string; title: string }[];
  sources: string[];
  searchParams: {
    startDate?: string;
    endDate?: string;
    positionId?: string;
    source?: string;
    tab?: string;
  };
}

export function ReportsClient({
  positions,
  sources,
  searchParams,
}: ReportsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const urlSearchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState(
    searchParams.tab || 'candidate-status'
  );

  useEffect(() => {
    setActiveTab(searchParams.tab || 'candidate-status');
  }, [searchParams.tab]);

  // Memoize so prop identity is stable when filter values are unchanged.
  // Each report has `useEffect([filters])` and would otherwise refetch on
  // every parent render.
  const filters = useMemo<ReportFiltersType>(
    () => ({
      startDate: parseDate(searchParams.startDate),
      endDate: parseDate(searchParams.endDate),
      positionId: cleanString(searchParams.positionId),
      source: cleanString(searchParams.source),
    }),
    [
      searchParams.startDate,
      searchParams.endDate,
      searchParams.positionId,
      searchParams.source,
    ]
  );

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const params = new URLSearchParams(urlSearchParams.toString());
    params.set('tab', value);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Reports</h1>
        <p className='text-muted-foreground'>
          Analyze recruitment metrics and trends
        </p>
      </div>

      <ReportFilters
        positions={positions}
        sources={sources}
        activeFilters={filters}
      />

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className='space-y-6'
      >
        <TabsList className='w-full grid grid-cols-3 lg:grid-cols-6'>
          <TabsTrigger value='candidate-status'>Candidate Status</TabsTrigger>
          <TabsTrigger value='sources'>Sources</TabsTrigger>
          <TabsTrigger value='positions'>Positions</TabsTrigger>
          <TabsTrigger value='time-to-hire'>Time to Hire</TabsTrigger>
          <TabsTrigger value='interview-outcomes'>
            Interview Outcomes
          </TabsTrigger>
          <TabsTrigger value='monthly-hires'>Monthly Hires</TabsTrigger>
        </TabsList>

        <TabsContent value='candidate-status' className='p-0'>
          <CandidateStatusReport filters={filters} />
        </TabsContent>
        <TabsContent value='sources' className='p-0'>
          <SourcesReport filters={filters} />
        </TabsContent>
        <TabsContent value='positions' className='p-0'>
          <PositionsReport filters={filters} />
        </TabsContent>
        <TabsContent value='time-to-hire' className='p-0'>
          <TimeToHireReport filters={filters} />
        </TabsContent>
        <TabsContent value='interview-outcomes' className='p-0'>
          <InterviewOutcomesReport filters={filters} />
        </TabsContent>
        <TabsContent value='monthly-hires' className='p-0'>
          <MonthlyHiresReport filters={filters} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function parseDate(value?: string): Date | undefined {
  if (!value || value === '$undefined') return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function cleanString(value?: string): string | undefined {
  return value && value !== '$undefined' ? value : undefined;
}
