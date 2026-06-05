import { auth } from '@/auth';
import { redirect } from 'next/navigation';
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
import { UserRole } from '@/lib/generated/prisma/browser';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const [upcomingInterviews, recentCandidates, stats] = await Promise.all([
    getUpcomingInterviews(),
    getRecentCandidates(),
    getDashboardStats(),
  ]);

  const isManager =
    session.user.role === UserRole.ADMIN ||
    session.user.role === UserRole.MANAGER;

  return (
    <div className='mx-auto flex max-w-[1200px] flex-col gap-8'>
      <PageHeader
        eyebrow='Overview'
        title={`Welcome back, ${session.user.name?.split(' ')[0] ?? 'there'}.`}
        description="Here's where your hiring stands this week."
      />

      <Suspense fallback={<div className='text-sm text-muted-foreground'>Loading stats…</div>}>
        <DashboardSummary stats={stats} />
      </Suspense>

      {isManager && (
        <Suspense fallback={<div className='text-sm text-muted-foreground'>Loading charts…</div>}>
          <DashboardCharts stats={stats} />
        </Suspense>
      )}

      <div className='grid gap-5 lg:grid-cols-2'>
        <DashboardOverview
          title='Upcoming interviews'
          data={upcomingInterviews}
          viewAllHref='/dashboard/interviews'
        />
        <DashboardOverview
          title='Recent candidates'
          data={recentCandidates}
          viewAllHref='/dashboard/candidates'
        />
      </div>
    </div>
  );
}
