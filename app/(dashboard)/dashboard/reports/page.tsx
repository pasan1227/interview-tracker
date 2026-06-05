import { auth } from '@/auth';
import { requirePageRole } from '@/lib/authz';
import { ReportsClient } from '@/components/reports/reports-client';
import { db } from '@/lib/db';
import { UserRole } from '@/lib/generated/prisma/browser';
import { redirect } from 'next/navigation';

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  if (
    session.user.role !== UserRole.ADMIN &&
    session.user.role !== UserRole.MANAGER
  ) {
    redirect('/dashboard');
  }

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

  // Filter values come from the URL; ReportsClient reads them via
  // useSearchParams so we don't need to await/forward them here.
  return <ReportsClient positions={positions} sources={sources} />;
}
