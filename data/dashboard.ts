import { db } from '@/lib/db';
import { CandidateStatus, InterviewStatus } from '@/lib/generated/prisma/browser';
import { addDays, subDays, subMonths } from 'date-fns';
import { cache } from 'react';

export interface DashboardStats {
  totalCandidates: number;
  candidateChange: number;
  scheduledInterviews: number;
  completedInterviews: number;
  avgTimeToHire: number;
  timeToHireChange: number;
  candidatesBySource: { source: string; count: number }[];
  interviewsByPosition: { position: string; count: number }[];
  hiringFunnel: {
    new: number;
    inProcess: number;
    offered: number;
    hired: number;
    rejected: number;
    withdrawn: number;
  };
  monthlyHires: { month: string; count: number }[];
}

const EMPTY_FUNNEL = {
  new: 0,
  inProcess: 0,
  offered: 0,
  hired: 0,
  rejected: 0,
  withdrawn: 0,
};

const EMPTY_STATS: DashboardStats = {
  totalCandidates: 0,
  candidateChange: 0,
  scheduledInterviews: 0,
  completedInterviews: 0,
  avgTimeToHire: 0,
  timeToHireChange: 0,
  candidatesBySource: [],
  interviewsByPosition: [],
  hiringFunnel: EMPTY_FUNNEL,
  monthlyHires: [],
};

// Request-scoped memoization. The dashboard renders SummarySection and
// (for managers) ChartsSection as separate Suspense'd server components;
// cache() lets both reuse one query result instead of running it twice
// in parallel.
export const getDashboardStats = cache(_getDashboardStats);

async function _getDashboardStats(): Promise<DashboardStats> {
  try {
    const now = new Date();
    const lastMonth = subMonths(now, 1);
    const thirtyDaysAgo = subDays(now, 30);
    const nextWeek = addDays(now, 7);
    const sixMonthsAgo = subMonths(now, 6);

    // Fire every independent query in one round trip. The dependent
    // position-title join below is the only sequential step.
    const [
      totalCandidates,
      totalCandidatesLastMonth,
      scheduledInterviews,
      completedInterviews,
      avgTimeToHireRows,
      sourcesRaw,
      positionsRaw,
      funnel,
      monthlyHiresData,
    ] = await Promise.all([
      db.candidate.count(),
      db.candidate.count({ where: { createdAt: { lt: lastMonth } } }),
      db.interview.count({
        where: {
          startTime: { gte: now, lte: nextWeek },
          status: InterviewStatus.SCHEDULED,
        },
      }),
      db.interview.count({
        where: {
          endTime: { gte: thirtyDaysAgo, lte: now },
          status: InterviewStatus.COMPLETED,
        },
      }),
      // Postgres-side average of (updatedAt - createdAt) in days for HIRED
      // candidates. Replaces a findMany + reduce so payload + per-row work
      // stays at the DB.
      db.$queryRaw<[{ avg_days: number | null }]>`
        SELECT AVG(EXTRACT(EPOCH FROM ("updatedAt" - "createdAt")) / 86400)
          AS avg_days
        FROM "Candidate"
        WHERE "status" = 'HIRED'
      `,
      db.candidate.groupBy({
        by: ['source'],
        _count: { id: true },
        where: { source: { not: null } },
      }),
      db.interview.groupBy({ by: ['positionId'], _count: { id: true } }),
      db.candidate.groupBy({ by: ['status'], _count: { id: true } }),
      db.candidate.findMany({
        where: {
          status: CandidateStatus.HIRED,
          updatedAt: { gte: sixMonthsAgo },
        },
        select: { updatedAt: true },
      }),
    ]);

    const candidateChange =
      totalCandidatesLastMonth === 0
        ? 100
        : Math.round(
            ((totalCandidates - totalCandidatesLastMonth) /
              totalCandidatesLastMonth) *
              100
          );

    const avgTimeToHire = Math.round(avgTimeToHireRows[0]?.avg_days ?? 0);

    // Placeholder until we wire historical comparison; negative is better.
    const timeToHireChange = -5;

    const candidatesBySource = sourcesRaw
      .map((item) => ({
        source: item.source || 'Unknown',
        count: item._count.id,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Look up titles for the top-N positions only (small, bounded set).
    const topPositionIds = positionsRaw
      .map((p) => p.positionId)
      .filter((id): id is string => Boolean(id));
    const positions = topPositionIds.length
      ? await db.position.findMany({
          where: { id: { in: topPositionIds } },
          select: { id: true, title: true },
        })
      : [];
    const positionTitle = new Map(positions.map((p) => [p.id, p.title]));

    const interviewsByPosition = positionsRaw
      .map((item) => ({
        position: positionTitle.get(item.positionId ?? '') || 'Unknown',
        count: item._count.id,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const hiringFunnel = { ...EMPTY_FUNNEL };
    for (const item of funnel) {
      const count = item._count.id;
      switch (item.status) {
        case CandidateStatus.NEW:        hiringFunnel.new = count; break;
        case CandidateStatus.IN_PROCESS: hiringFunnel.inProcess = count; break;
        case CandidateStatus.OFFERED:    hiringFunnel.offered = count; break;
        case CandidateStatus.HIRED:      hiringFunnel.hired = count; break;
        case CandidateStatus.REJECTED:   hiringFunnel.rejected = count; break;
        case CandidateStatus.WITHDRAWN:  hiringFunnel.withdrawn = count; break;
      }
    }

    const monthlyHiresCounts: Record<string, number> = {};
    for (let i = 0; i < 6; i++) {
      const month = subMonths(now, i);
      monthlyHiresCounts[`${month.getFullYear()}-${month.getMonth() + 1}`] = 0;
    }
    for (const hire of monthlyHiresData) {
      const key = `${hire.updatedAt.getFullYear()}-${hire.updatedAt.getMonth() + 1}`;
      if (monthlyHiresCounts[key] !== undefined) {
        monthlyHiresCounts[key]++;
      }
    }

    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];

    const monthlyHires = Object.entries(monthlyHiresCounts)
      .map(([key, count]) => {
        const [year, month] = key.split('-').map(Number);
        return { month: `${monthNames[month - 1]} ${year}`, count };
      })
      .reverse();

    return {
      totalCandidates,
      candidateChange,
      scheduledInterviews,
      completedInterviews,
      avgTimeToHire,
      timeToHireChange,
      candidatesBySource,
      interviewsByPosition,
      hiringFunnel,
      monthlyHires,
    };
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    return EMPTY_STATS;
  }
}

export async function getUpcomingInterviews(limit = 5) {
  try {
    const now = new Date();
    const nextWeek = addDays(now, 7);

    return await db.interview.findMany({
      where: {
        startTime: { gte: now, lte: nextWeek },
        status: InterviewStatus.SCHEDULED,
      },
      include: {
        candidate: true,
        position: true,
        interviewers: { select: { id: true, name: true } },
      },
      orderBy: { startTime: 'asc' },
      take: limit,
    });
  } catch (error) {
    console.error('Failed to fetch upcoming interviews:', error);
    return [];
  }
}

export async function getRecentCandidates(limit = 5) {
  try {
    return await db.candidate.findMany({
      include: { position: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  } catch (error) {
    console.error('Failed to fetch recent candidates:', error);
    return [];
  }
}
