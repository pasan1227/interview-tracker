import { DashboardOverview } from '@/components/dashboard/dashboard-overview';
import { DashboardSummary } from '@/components/dashboard/dashboard-summary';
import { DashboardCharts } from '@/components/dashboard/dashboard-charts-lazy';
import { PageHeader } from '@/components/dashboard/page-header';
import {
  getUpcomingInterviews,
  getRecentCandidates,
  getDashboardStats,
} from '@/data/dashboard';
import { Suspense } from 'react';
import { requirePageOrgSession, toOrgContext } from '@/lib/authz';
import { OrganizationRole } from '@/lib/generated/prisma/browser';
import type { OrgContext } from '@/lib/tenant-db';

// Each section is its own async server component so its data fetch
// suspends independently. The page shell (header + skeletons) flushes
// immediately and each block streams in as its query resolves —
// previously the parent's Promise.all forced one round-trip before
// anything painted, making the wrapping <Suspense> a no-op.

export default async function DashboardPage() {
  const session = await requirePageOrgSession();
  const ctx = toOrgContext(session);

  const firstName = session.name?.split(' ')[0] ?? 'there';
  const isManager =
    session.role === OrganizationRole.OWNER ||
    session.role === OrganizationRole.ADMIN ||
    session.role === OrganizationRole.MANAGER;

  return (
    <div className='mx-auto flex max-w-[1200px] flex-col gap-8'>
      <PageHeader
        eyebrow='Overview'
        title={`Welcome back, ${firstName}.`}
        description="Here's where your hiring stands this week."
      />

      <Suspense fallback={<SummarySkeleton />}>
        <SummarySection ctx={ctx} />
      </Suspense>

      {isManager && (
        <Suspense fallback={<ChartsSkeleton />}>
          <ChartsSection ctx={ctx} />
        </Suspense>
      )}

      <div className='grid gap-5 lg:grid-cols-2'>
        <Suspense fallback={<OverviewSkeleton />}>
          <UpcomingInterviewsSection ctx={ctx} />
        </Suspense>
        <Suspense fallback={<OverviewSkeleton />}>
          <RecentCandidatesSection ctx={ctx} />
        </Suspense>
      </div>
    </div>
  );
}

async function SummarySection({ ctx }: { ctx: OrgContext }) {
  const stats = await getDashboardStats(ctx);
  return <DashboardSummary stats={stats} />;
}

async function ChartsSection({ ctx }: { ctx: OrgContext }) {
  // getDashboardStats is wrapped in React.cache() so this is a no-op
  // when SummarySection already resolved it in the same request.
  const stats = await getDashboardStats(ctx);
  return <DashboardCharts stats={stats} />;
}

async function UpcomingInterviewsSection({ ctx }: { ctx: OrgContext }) {
  const data = await getUpcomingInterviews(ctx);
  return (
    <DashboardOverview
      title='Upcoming interviews'
      data={data}
      viewAllHref='/interviews'
    />
  );
}

async function RecentCandidatesSection({ ctx }: { ctx: OrgContext }) {
  const data = await getRecentCandidates(ctx);
  return (
    <DashboardOverview
      title='Recent candidates'
      data={data}
      viewAllHref='/candidates'
    />
  );
}

// Skeletons keep the layout from shifting as sections stream in.

function SummarySkeleton() {
  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4' aria-hidden>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className='h-[148px] rounded-xl border border-border bg-card'
        />
      ))}
    </div>
  );
}

function ChartsSkeleton() {
  return (
    <div
      className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'
      aria-hidden
    >
      <div className='h-[26rem] rounded-xl border border-border bg-card' />
      <div className='h-[26rem] rounded-xl border border-border bg-card' />
      <div className='h-[26rem] rounded-xl border border-border bg-card' />
      <div className='h-80 rounded-xl border border-border bg-card md:col-span-2 lg:col-span-3' />
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div
      className='h-[360px] rounded-xl border border-border bg-card'
      aria-hidden
    />
  );
}
