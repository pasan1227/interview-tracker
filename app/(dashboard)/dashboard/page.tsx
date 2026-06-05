import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { DashboardOverview } from '@/components/dashboard/dashboard-overview';
import { DashboardSummary } from '@/components/dashboard/dashboard-summary';
import { DashboardCharts } from '@/components/dashboard/dashboard-charts';
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
      <header className='flex flex-col gap-2'>
        <div
          className='flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em]'
          style={{ color: 'var(--muted-foreground)' }}
        >
          <span
            className='inline-block size-1.5 rounded-full'
            style={{ backgroundColor: 'var(--forest)' }}
          />
          Overview
        </div>
        <h1 className='text-[clamp(1.75rem,3vw,2.25rem)] font-medium leading-[1.1] tracking-[-0.03em]'>
          Welcome back, {session.user.name?.split(' ')[0] ?? 'there'}.
        </h1>
        <p
          className='max-w-[60ch] text-[15px] leading-[1.55]'
          style={{ color: 'var(--muted-foreground)' }}
        >
          Here&apos;s where your hiring stands this week.
        </p>
      </header>

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
