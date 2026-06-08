'use server';

import { requireOrgManagerOrAdmin, toOrgContext } from '@/lib/authz';
import { db as baseDb } from '@/lib/db';
import {
  CandidateStatus,
  InterviewStatus,
  Prisma,
  Recommendation,
} from '@/lib/generated/prisma/browser';
import { tenantDb } from '@/lib/tenant-db';
import {
  ReportFiltersSchema,
  type ReportFiltersInput,
} from '@/lib/validations/dashboard';
import { format, subMonths } from 'date-fns';
import { z } from 'zod';

// Public input type is the loose form-style shape; internally we coerce.
export type ReportFilters = ReportFiltersInput;
type ParsedFilters = z.infer<typeof ReportFiltersSchema>;

// Strip "$undefined" sentinels Next.js may emit through server-action
// serialization, then validate with Zod.
function sanitizeFilters(filters: ReportFilters = {}): ParsedFilters {
  const cleaned = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== '$undefined')
  );
  const result = ReportFiltersSchema.safeParse(cleaned);
  return result.success ? result.data : {};
}

// Candidate reports all share the same filter shape (date range,
// position, source). Centralise the where-builder so adding a filter is
// one edit, not three — and give it a real Prisma type so a renamed
// column is a compile error.
function buildCandidateReportWhere(
  filters: ParsedFilters
): Prisma.CandidateWhereInput {
  const where: Prisma.CandidateWhereInput = {};
  if (filters.startDate || filters.endDate) {
    where.createdAt = {
      ...(filters.startDate && { gte: filters.startDate }),
      ...(filters.endDate && { lte: filters.endDate }),
    };
  }
  if (filters.positionId) where.positionId = filters.positionId;
  if (filters.source) where.source = filters.source;
  return where;
}

export async function getCandidateStatusReport(rawFilters: ReportFilters = {}) {
  const user = await requireOrgManagerOrAdmin();
  const db = tenantDb(toOrgContext(user));
  const filters = sanitizeFilters(rawFilters);

  try {
    const where = buildCandidateReportWhere(filters);

    const candidatesByStatus = await db.candidate.groupBy({
      by: ['status'],
      _count: { id: true },
      where,
    });

    const statusData = Object.values(CandidateStatus).map((status) => {
      const found = candidatesByStatus.find((item) => item.status === status);
      return {
        status,
        count: found ? found._count.id : 0,
      };
    });

    const totalCandidates = statusData.reduce(
      (sum, item) => sum + item.count,
      0
    );

    return { data: statusData, totalCandidates };
  } catch (error) {
    console.error('Failed to fetch candidate status report:', error);
    return { data: [], totalCandidates: 0 };
  }
}

export async function getSourceReport(rawFilters: ReportFilters = {}) {
  const user = await requireOrgManagerOrAdmin();
  const db = tenantDb(toOrgContext(user));
  const filters = sanitizeFilters(rawFilters);

  try {
    const { source: _source, ...rest } = filters;
    const where: Prisma.CandidateWhereInput = {
      ...buildCandidateReportWhere(rest),
      source: { not: null },
    };

    const candidatesBySource = await db.candidate.groupBy({
      by: ['source'],
      _count: { id: true },
      where,
    });

    const sortedData = candidatesBySource
      .map((item) => ({
        source: item.source || 'Unknown',
        count: item._count.id,
      }))
      .sort((a, b) => b.count - a.count);

    const totalCandidates = sortedData.reduce(
      (sum, item) => sum + item.count,
      0
    );

    return { data: sortedData, totalCandidates };
  } catch (error) {
    console.error('Failed to fetch source report:', error);
    return { data: [], totalCandidates: 0 };
  }
}

export async function getPositionReport(rawFilters: ReportFilters = {}) {
  const user = await requireOrgManagerOrAdmin();
  const db = tenantDb(toOrgContext(user));
  const filters = sanitizeFilters(rawFilters);

  try {
    const { positionId: _pid, ...rest } = filters;
    const where: Prisma.CandidateWhereInput = {
      ...buildCandidateReportWhere(rest),
      positionId: { not: null },
    };

    const candidatesByPosition = await db.candidate.groupBy({
      by: ['positionId'],
      _count: { id: true },
      where,
    });

    const positions = await db.position.findMany({
      where: {
        id: { in: candidatesByPosition.map((item) => item.positionId || '') },
      },
      select: { id: true, title: true },
    });

    const positionData = candidatesByPosition
      .map((item) => {
        const position = positions.find((p) => p.id === item.positionId);
        return {
          position: position?.title || 'Unknown',
          count: item._count.id,
        };
      })
      .sort((a, b) => b.count - a.count);

    const totalCandidates = positionData.reduce(
      (sum, item) => sum + item.count,
      0
    );

    return { data: positionData, totalCandidates };
  } catch (error) {
    console.error('Failed to fetch position report:', error);
    return { data: [], totalCandidates: 0 };
  }
}

export async function getTimeToHireReport(rawFilters: ReportFilters = {}) {
  const user = await requireOrgManagerOrAdmin();
  const orgId = toOrgContext(user).organizationId;
  const filters = sanitizeFilters(rawFilters);

  try {
    // Raw queries bypass tenantDb — every WHERE clause carries an
    // explicit organizationId filter.
    const startDate = filters.startDate ?? null;
    const endDate = filters.endDate ?? null;
    const positionId = filters.positionId ?? null;
    const source = filters.source ?? null;

    const perPosition = await baseDb.$queryRaw<
      Array<{ position: string; avg_days: number; count: bigint }>
    >`
      SELECT
        COALESCE(p."title", 'Unknown') AS position,
        ROUND(AVG(EXTRACT(EPOCH FROM (c."updatedAt" - c."createdAt")) / 86400))::int AS avg_days,
        COUNT(*)::bigint AS count
      FROM "Candidate" c
      LEFT JOIN "Position" p ON p."id" = c."positionId"
      WHERE c."status" = ${CandidateStatus.HIRED}::"CandidateStatus"
        AND c."organizationId" = ${orgId}
        AND (${startDate}::timestamp IS NULL OR c."updatedAt" >= ${startDate}::timestamp)
        AND (${endDate}::timestamp   IS NULL OR c."updatedAt" <= ${endDate}::timestamp)
        AND (${positionId}::text     IS NULL OR c."positionId" = ${positionId})
        AND (${source}::text         IS NULL OR c."source" = ${source})
      GROUP BY COALESCE(p."title", 'Unknown')
      ORDER BY avg_days ASC
    `;

    const [overall] = await baseDb.$queryRaw<
      Array<{ avg_days: number | null; total: bigint }>
    >`
      SELECT
        ROUND(AVG(EXTRACT(EPOCH FROM (c."updatedAt" - c."createdAt")) / 86400))::int AS avg_days,
        COUNT(*)::bigint AS total
      FROM "Candidate" c
      WHERE c."status" = ${CandidateStatus.HIRED}::"CandidateStatus"
        AND c."organizationId" = ${orgId}
        AND (${startDate}::timestamp IS NULL OR c."updatedAt" >= ${startDate}::timestamp)
        AND (${endDate}::timestamp   IS NULL OR c."updatedAt" <= ${endDate}::timestamp)
        AND (${positionId}::text     IS NULL OR c."positionId" = ${positionId})
        AND (${source}::text         IS NULL OR c."source" = ${source})
    `;

    return {
      avgTimeToHire: overall?.avg_days ?? 0,
      positionAverages: perPosition.map((r) => ({
        position: r.position,
        avgDays: r.avg_days,
        count: Number(r.count),
      })),
      totalHires: Number(overall?.total ?? 0),
    };
  } catch (error) {
    console.error('Failed to fetch time to hire report:', error);
    return { avgTimeToHire: 0, positionAverages: [], totalHires: 0 };
  }
}

export async function getInterviewOutcomeReport(
  rawFilters: ReportFilters = {}
) {
  const user = await requireOrgManagerOrAdmin();
  const db = tenantDb(toOrgContext(user));
  const filters = sanitizeFilters(rawFilters);

  try {
    const interviewWhere: Prisma.InterviewWhereInput = {
      status: InterviewStatus.COMPLETED,
      ...(filters.startDate || filters.endDate
        ? {
            startTime: {
              ...(filters.startDate && { gte: filters.startDate }),
              ...(filters.endDate && { lte: filters.endDate }),
            },
          }
        : {}),
      ...(filters.positionId
        ? { candidate: { positionId: filters.positionId } }
        : {}),
    };

    const [counts, totalInterviews, interviewsWithFeedback] = await Promise.all([
      db.feedback.groupBy({
        by: ['recommendation'],
        _count: { _all: true },
        where: { interview: interviewWhere },
      }),
      db.interview.count({ where: interviewWhere }),
      db.interview.count({
        where: { ...interviewWhere, feedbacks: { some: {} } },
      }),
    ]);

    const byRecommendation = new Map<Recommendation, number>(
      counts.map((c) => [c.recommendation, c._count._all])
    );
    const outcomeData = Object.values(Recommendation).map((recommendation) => ({
      recommendation,
      count: byRecommendation.get(recommendation) ?? 0,
    }));

    const totalFeedback = outcomeData.reduce((sum, r) => sum + r.count, 0);

    return {
      data: outcomeData,
      totalFeedback,
      totalInterviews,
      interviewsWithFeedback,
    };
  } catch (error) {
    console.error('Failed to fetch interview outcome report:', error);
    return {
      data: [],
      totalFeedback: 0,
      totalInterviews: 0,
      interviewsWithFeedback: 0,
    };
  }
}

export async function getMonthlyHiresReport(rawFilters: ReportFilters = {}) {
  const user = await requireOrgManagerOrAdmin();
  const orgId = toOrgContext(user).organizationId;
  const filters = sanitizeFilters(rawFilters);

  try {
    const endDate = filters.endDate || new Date();
    const startDate = filters.startDate || subMonths(endDate, 11);
    const positionId = filters.positionId ?? null;
    const source = filters.source ?? null;

    const rows = await baseDb.$queryRaw<
      Array<{ month: Date; count: bigint }>
    >`
      SELECT
        date_trunc('month', c."updatedAt") AS month,
        COUNT(*)::bigint AS count
      FROM "Candidate" c
      WHERE c."status" = ${CandidateStatus.HIRED}::"CandidateStatus"
        AND c."organizationId" = ${orgId}
        AND c."updatedAt" >= ${startDate}::timestamp
        AND c."updatedAt" <= ${endDate}::timestamp
        AND (${positionId}::text IS NULL OR c."positionId" = ${positionId})
        AND (${source}::text     IS NULL OR c."source" = ${source})
      GROUP BY 1
      ORDER BY 1
    `;

    const byKey = new Map(
      rows.map((r) => [format(r.month, 'yyyy-MM'), Number(r.count)])
    );
    const data: Array<{ month: string; count: number }> = [];
    let cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    while (cursor <= endMonth) {
      data.push({
        month: format(cursor, 'MMM yyyy'),
        count: byKey.get(format(cursor, 'yyyy-MM')) ?? 0,
      });
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    }

    const totalHires = data.reduce((sum, r) => sum + r.count, 0);
    return { data, totalHires };
  } catch (error) {
    console.error('Failed to fetch monthly hires report:', error);
    return { data: [], totalHires: 0 };
  }
}
