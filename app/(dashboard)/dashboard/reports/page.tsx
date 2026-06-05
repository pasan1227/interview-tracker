import {
  getCandidateStatusReport,
  getInterviewOutcomeReport,
  getMonthlyHiresReport,
  getPositionReport,
  getSourceReport,
  getTimeToHireReport,
} from '@/actions/reports';
import { ReportTabs } from '@/components/reports/report-tabs';
import { ReportFilters } from '@/components/reports/report-filters';
import { ReportSkeleton } from '@/components/reports/report-skeleton';
import { CandidateStatusReport } from '@/components/reports/candidate-status-report';
import { InterviewOutcomesReport } from '@/components/reports/interview-outcomes-report';
import { MonthlyHiresReport } from '@/components/reports/monthly-hires-report';
import { PositionsReport } from '@/components/reports/positions-report';
import { SourcesReport } from '@/components/reports/sources-report';
import { TimeToHireReport } from '@/components/reports/time-to-hire-report';
import { requirePageRole } from '@/lib/authz';
import { db } from '@/lib/db';
import { UserRole } from '@/lib/generated/prisma/browser';
import { Suspense } from 'react';

// URL-driven page state: ?tab + filter params.
//   tab=candidate-status (default) | sources | positions | time-to-hire |
//        interview-outcomes | monthly-hires
//   startDate / endDate / positionId / source — applied to the active
//   tab's server fetch.
//
// Previously a six-tab client orchestrator triggered one useEffect →
// server-action round-trip per tab. Now each tab is server-rendered;
// switching tabs is a Link navigation; the inactive tabs do no work.

const TAB_VALUES = [
  'candidate-status',
  'sources',
  'positions',
  'time-to-hire',
  'interview-outcomes',
  'monthly-hires',
] as const;
type TabValue = (typeof TAB_VALUES)[number];

const DEFAULT_TAB: TabValue = 'candidate-status';

const TAB_LABELS: Record<TabValue, string> = {
  'candidate-status': 'Candidate Status',
  sources: 'Sources',
  positions: 'Positions',
  'time-to-hire': 'Time to Hire',
  'interview-outcomes': 'Interview Outcomes',
  'monthly-hires': 'Monthly Hires',
};

interface ReportsPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  await requirePageRole([UserRole.ADMIN, UserRole.MANAGER]);

  const sp = await searchParams;
  const activeTab: TabValue = TAB_VALUES.includes(sp.tab as TabValue)
    ? (sp.tab as TabValue)
    : DEFAULT_TAB;
  const filters = parseFilters(sp);

  const [positions, sourcesRaw] = await Promise.all([
    db.position.findMany({
      where: { isActive: true },
      orderBy: { title: 'asc' },
      select: { id: true, title: true },
    }),
    db.candidate.groupBy({
      by: ['source'],
      where: { source: { not: null } },
    }),
  ]);
  const sources = sourcesRaw
    .map((s) => s.source)
    .filter((s): s is string => Boolean(s))
    .sort();

  return (
    <div className='mx-auto flex max-w-[1200px] flex-col gap-6'>
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

      <ReportTabs activeTab={activeTab} labels={TAB_LABELS} />

      <Suspense
        // Key on tab + filters so each navigation immediately shows the
        // skeleton instead of holding the previous tab's content.
        key={`${activeTab}-${sp.startDate ?? ''}-${sp.endDate ?? ''}-${
          sp.positionId ?? ''
        }-${sp.source ?? ''}`}
        fallback={<ReportSkeleton />}
      >
        <ActiveReport tab={activeTab} filters={filters} />
      </Suspense>
    </div>
  );
}

async function ActiveReport({
  tab,
  filters,
}: {
  tab: TabValue;
  filters: ReturnType<typeof parseFilters>;
}) {
  switch (tab) {
    case 'candidate-status': {
      const result = await getCandidateStatusReport(filters);
      return <CandidateStatusReport result={result} />;
    }
    case 'sources': {
      const result = await getSourceReport(filters);
      return <SourcesReport result={result} />;
    }
    case 'positions': {
      const result = await getPositionReport(filters);
      return <PositionsReport result={result} />;
    }
    case 'time-to-hire': {
      const result = await getTimeToHireReport(filters);
      return <TimeToHireReport result={result} />;
    }
    case 'interview-outcomes': {
      const result = await getInterviewOutcomeReport(filters);
      return <InterviewOutcomesReport result={result} />;
    }
    case 'monthly-hires': {
      const result = await getMonthlyHiresReport(filters);
      return <MonthlyHiresReport result={result} />;
    }
  }
}

function parseFilters(sp: Record<string, string | undefined>) {
  return {
    startDate: parseDate(sp.startDate),
    endDate: parseDate(sp.endDate),
    positionId: cleanString(sp.positionId),
    source: cleanString(sp.source),
  };
}

function parseDate(value: string | undefined): Date | undefined {
  if (!value || value === '$undefined') return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function cleanString(value: string | undefined): string | undefined {
  return value && value !== '$undefined' ? value : undefined;
}
