import { db as baseDb } from '@/lib/db';
import { CandidateStatus, InterviewStatus } from '@/lib/generated/prisma/browser';
import { tenantDb, type OrgContext } from '@/lib/tenant-db';
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
// in parallel. Keyed implicitly by argument equality — same ctx → same
// cached result.
export const getDashboardStats = cache(_getDashboardStats);

async function _getDashboardStats(ctx: OrgContext): Promise<DashboardStats> {
  try {
    const db = tenantDb(ctx);
    const now = new Date();
    const lastMonth = subMonths(now, 1);
    const thirtyDaysAgo = subDays(now, 30);
    const nextWeek = addDays(now, 7);
    const sixMonthsAgo = subMonths(now, 6);

    // Raw queries bypass tenantDb — embed organizationId in the WHERE
    // clause explicitly. Prisma's typed groupBy / count calls below are
    // scoped automatically.
    const orgId = ctx.organizationId;

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
      baseDb.$queryRaw<[{ avg_days: number | null }]>`
        SELECT AVG(EXTRACT(EPOCH FROM ("updatedAt" - "createdAt")) / 86400)
          AS avg_days
        FROM "Candidate"
        WHERE "status" = 'HIRED'
          AND "organizationId" = ${orgId}
      `,
      db.candidate.groupBy({
        by: ['source'],
        _count: { id: true },
        where: { source: { not: null } },
      }),
      db.interview.groupBy({ by: ['positionId'], _count: { id: true } }),
      db.candidate.groupBy({ by: ['status'], _count: { id: true } }),
      baseDb.$queryRaw<Array<{ month: Date; count: bigint }>>`
        SELECT
          date_trunc('month', "updatedAt") AS month,
          COUNT(*)::bigint AS count
        FROM "Candidate"
        WHERE "status" = 'HIRED'
          AND "organizationId" = ${orgId}
          AND "updatedAt" >= ${sixMonthsAgo}::timestamp
        GROUP BY 1
        ORDER BY 1
      `,
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

    // Bucketed counts come from Postgres. Fill in any zero-count
    // months JS-side so the chart x-axis is a stable 6-month strip.
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    const monthlyHiresByKey = new Map(
      monthlyHiresData.map((r) => {
        const d = new Date(r.month);
        return [`${d.getFullYear()}-${d.getMonth() + 1}`, Number(r.count)];
      })
    );
    const monthlyHires: Array<{ month: string; count: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const m = subMonths(now, i);
      const key = `${m.getFullYear()}-${m.getMonth() + 1}`;
      monthlyHires.push({
        month: `${monthNames[m.getMonth()]} ${m.getFullYear()}`,
        count: monthlyHiresByKey.get(key) ?? 0,
      });
    }

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

// Request-scoped memoization — same justification as getDashboardStats.
// The dashboard root renders Upcoming + Recent in parallel Suspense
// boundaries; a future header widget or layout that also pulls them
// won't issue a duplicate query.
export const getUpcomingInterviews = cache(_getUpcomingInterviews);

async function _getUpcomingInterviews(ctx: OrgContext, limit = 5) {
  try {
    const db = tenantDb(ctx);
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

export const getRecentCandidates = cache(_getRecentCandidates);

async function _getRecentCandidates(ctx: OrgContext, limit = 5) {
  try {
    const db = tenantDb(ctx);
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
