'use client';

import { ReportFilters } from '@/components/reports/report-filters';
import { ReportSkeleton } from '@/components/reports/report-skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ReportFilters as ReportFiltersType } from '@/data/reports';
import dynamic from 'next/dynamic';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo, type ComponentType } from 'react';

// Each report ships its own recharts payload; load them lazily so opening
// the page only pays for the active tab. ssr:false because recharts is
// client-only. Next requires the options to be inline literals, so the
// same {ssr,loading} shape is repeated below.
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

type ReportComponent = ComponentType<{ filters: ReportFiltersType }>;

interface TabDef {
  value: string;
  label: string;
  Component: ReportComponent;
}

const TABS: readonly TabDef[] = [
  { value: 'candidate-status', label: 'Candidate Status', Component: CandidateStatusReport },
  { value: 'sources', label: 'Sources', Component: SourcesReport },
  { value: 'positions', label: 'Positions', Component: PositionsReport },
  { value: 'time-to-hire', label: 'Time to Hire', Component: TimeToHireReport },
  { value: 'interview-outcomes', label: 'Interview Outcomes', Component: InterviewOutcomesReport },
  { value: 'monthly-hires', label: 'Monthly Hires', Component: MonthlyHiresReport },
];

const DEFAULT_TAB = TABS[0].value;

interface ReportsClientProps {
  positions: { id: string; title: string }[];
  sources: string[];
}

export function ReportsClient({ positions, sources }: ReportsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const activeTab = params.get('tab') || DEFAULT_TAB;

  // Read filter values straight from the reactive search params. Memoize so
  // each report's `useEffect([filters])` only refetches when contents
  // actually change.
  const filters = useMemo<ReportFiltersType>(
    () => ({
      startDate: parseDate(params.get('startDate')),
      endDate: parseDate(params.get('endDate')),
      positionId: cleanString(params.get('positionId')),
      source: cleanString(params.get('source')),
    }),
    [params]
  );

  const handleTabChange = (value: string) => {
    const next = new URLSearchParams(params.toString());
    next.set('tab', value);
    router.push(`${pathname}?${next.toString()}`);
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
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map(({ value, Component }) => (
          <TabsContent key={value} value={value} className='p-0'>
            <Component filters={filters} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function parseDate(value: string | null): Date | undefined {
  if (!value || value === '$undefined') return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function cleanString(value: string | null): string | undefined {
  return value && value !== '$undefined' ? value : undefined;
}
