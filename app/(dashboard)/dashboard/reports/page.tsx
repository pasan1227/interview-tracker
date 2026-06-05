// app/(dashboard)/dashboard/reports/page.tsx

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import { UserRole } from '@/lib/generated/prisma/browser';
import { ReportsClient } from '@/components/reports/reports-client';

interface ReportsPageProps {
  searchParams: Promise<{
    startDate?: string;
    endDate?: string;
    positionId?: string;
    source?: string;
    tab?: string;
  }>;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const session = await auth();

  if (!session || !session.user) {
    redirect('/login');
  }

  // Only allow admins and managers to access reports
  if (
    session.user.role !== UserRole.ADMIN &&
    session.user.role !== UserRole.MANAGER
  ) {
    redirect('/dashboard');
  }

  // Get all active positions for filters
  const positions = await db.position.findMany({
    where: { isActive: true },
    orderBy: { title: 'asc' },
  });

  // Get all sources for filters
  const sourcesRaw = await db.candidate.groupBy({
    by: ['source'],
    where: {
      source: { not: null },
    },
  });

  const sources = sourcesRaw
    .map((s) => s.source)
    .filter(Boolean)
    .sort();

  // Pass the server-fetched data and raw searchParams to a client component
  return (
    <ReportsClient
      positions={positions}
      sources={sources as string[]}
      searchParams={await searchParams}
    />
  );
}
