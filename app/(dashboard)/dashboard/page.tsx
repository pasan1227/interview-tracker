// app/(dashboard)/dashboard/page.tsx

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

  if (!session || !session.user) {
    redirect('/login');
  }

  // Fetch data for the dashboard
  const upcomingInterviews = await getUpcomingInterviews();
  const recentCandidates = await getRecentCandidates();
  const stats = await getDashboardStats();

  const isManager =
    session.user.role === UserRole.ADMIN ||
    session.user.role === UserRole.MANAGER;

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Dashboard</h1>
        <p className='text-muted-foreground'>
          Overview of your interview tracking system
        </p>
      </div>

      <Suspense fallback={<div>Loading stats...</div>}>
        <DashboardSummary stats={stats} />
      </Suspense>

      {isManager && (
        <Suspense fallback={<div>Loading charts...</div>}>
          <DashboardCharts stats={stats} />
        </Suspense>
      )}

      <div className='grid gap-6 md:grid-cols-2'>
        <DashboardOverview
          title='Upcoming Interviews'
          data={upcomingInterviews}
          viewAllHref='/dashboard/interviews'
        />
        <DashboardOverview
          title='Recent Candidates'
          data={recentCandidates}
          viewAllHref='/dashboard/candidates'
        />
      </div>
    </div>
  );
}
