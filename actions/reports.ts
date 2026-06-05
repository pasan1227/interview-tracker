'use server';

import { requireManagerOrAdmin } from '@/lib/authz';
import { db } from '@/lib/db';
import {
  CandidateStatus,
  InterviewStatus,
  Recommendation,
} from '@/lib/generated/prisma/client';
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

export async function getCandidateStatusReport(rawFilters: ReportFilters = {}) {
  await requireManagerOrAdmin();
  const filters = sanitizeFilters(rawFilters);

  try {
    // Build where clause based on filters
    const where: any = {};

    if (filters.startDate) {
      where.createdAt = {
        ...where.createdAt,
        gte: filters.startDate,
      };
    }

    if (filters.endDate) {
      where.createdAt = {
        ...where.createdAt,
        lte: filters.endDate,
      };
    }

    if (filters.positionId) {
      where.positionId = filters.positionId;
    }

    if (filters.source) {
      where.source = filters.source;
    }

    // Get candidates grouped by status
    const candidatesByStatus = await db.candidate.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
      where,
    });

    // Transform into a format suitable for charts
    const statusData = Object.values(CandidateStatus).map((status) => {
      const found = candidatesByStatus.find((item) => item.status === status);
      return {
        status,
        count: found ? found._count.id : 0,
      };
    });

    // Calculate total
    const totalCandidates = statusData.reduce(
      (sum, item) => sum + item.count,
      0
    );

    return {
      data: statusData,
      totalCandidates,
    };
  } catch (error) {
    console.error('Failed to fetch candidate status report:', error);
    return {
      data: [],
      totalCandidates: 0,
    };
  }
}

export async function getSourceReport(rawFilters: ReportFilters = {}) {
  await requireManagerOrAdmin();
  const filters = sanitizeFilters(rawFilters);

  try {
    // Build where clause based on filters
    const where: any = {};

    if (filters.startDate) {
      where.createdAt = {
        ...where.createdAt,
        gte: filters.startDate,
      };
    }

    if (filters.endDate) {
      where.createdAt = {
        ...where.createdAt,
        lte: filters.endDate,
      };
    }

    if (filters.positionId) {
      where.positionId = filters.positionId;
    }

    // Add filter to exclude null sources
    where.source = { not: null };

    // Get candidates grouped by source
    const candidatesBySource = await db.candidate.groupBy({
      by: ['source'],
      _count: {
        id: true,
      },
      where,
    });

    // Sort by count
    const sortedData = candidatesBySource
      .map((item) => ({
        source: item.source || 'Unknown',
        count: item._count.id,
      }))
      .sort((a, b) => b.count - a.count);

    // Calculate total
    const totalCandidates = sortedData.reduce(
      (sum, item) => sum + item.count,
      0
    );

    return {
      data: sortedData,
      totalCandidates,
    };
  } catch (error) {
    console.error('Failed to fetch source report:', error);
    return {
      data: [],
      totalCandidates: 0,
    };
  }
}

export async function getPositionReport(rawFilters: ReportFilters = {}) {
  await requireManagerOrAdmin();
  const filters = sanitizeFilters(rawFilters);

  try {
    // Build where clause based on filters
    const where: any = {};

    if (filters.startDate) {
      where.createdAt = {
        ...where.createdAt,
        gte: filters.startDate,
      };
    }

    if (filters.endDate) {
      where.createdAt = {
        ...where.createdAt,
        lte: filters.endDate,
      };
    }

    if (filters.positionId) {
      where.positionId = filters.positionId;
    }

    if (filters.source) {
      where.source = filters.source;
    }

    // Add filter to exclude null positions
    where.positionId = { not: null };

    // Get candidates grouped by position
    const candidatesByPosition = await db.candidate.groupBy({
      by: ['positionId'],
      _count: {
        id: true,
      },
      where,
    });

    // Get position details
    const positions = await db.position.findMany({
      where: {
        id: {
          in: candidatesByPosition.map((item) => item.positionId || ''),
        },
      },
      select: {
        id: true,
        title: true,
      },
    });

    // Transform into a format suitable for charts
    const positionData = candidatesByPosition
      .map((item) => {
        const position = positions.find((p) => p.id === item.positionId);
        return {
          position: position?.title || 'Unknown',
          count: item._count.id,
        };
      })
      .sort((a, b) => b.count - a.count);

    // Calculate total
    const totalCandidates = positionData.reduce(
      (sum, item) => sum + item.count,
      0
    );

    return {
      data: positionData,
      totalCandidates,
    };
  } catch (error) {
    console.error('Failed to fetch position report:', error);
    return {
      data: [],
      totalCandidates: 0,
    };
  }
}

export async function getTimeToHireReport(rawFilters: ReportFilters = {}) {
  await requireManagerOrAdmin();
  const filters = sanitizeFilters(rawFilters);

  try {
    // Build where clause based on filters
    const where: any = {
      status: CandidateStatus.HIRED,
    };

    if (filters.startDate) {
      where.updatedAt = {
        ...where.updatedAt,
        gte: filters.startDate,
      };
    }

    if (filters.endDate) {
      where.updatedAt = {
        ...where.updatedAt,
        lte: filters.endDate,
      };
    }

    if (filters.positionId) {
      where.positionId = filters.positionId;
    }

    if (filters.source) {
      where.source = filters.source;
    }

    // Get hired candidates
    const hiredCandidates = await db.candidate.findMany({
      where,
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        position: {
          select: {
            title: true,
          },
        },
      },
    });

    // Calculate time to hire for each candidate (in days)
    const candidateData = hiredCandidates.map((candidate) => {
      const daysToHire = Math.ceil(
        (candidate.updatedAt.getTime() - candidate.createdAt.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      return {
        id: candidate.id,
        daysToHire,
        position: candidate.position?.title || 'Unknown',
      };
    });

    // Calculate average time to hire
    const totalDays = candidateData.reduce(
      (sum, item) => sum + item.daysToHire,
      0
    );
    const avgTimeToHire =
      candidateData.length > 0
        ? Math.round(totalDays / candidateData.length)
        : 0;

    // Group by position
    const positionGroups: Record<string, { total: number; count: number }> = {};

    candidateData.forEach((item) => {
      if (!positionGroups[item.position]) {
        positionGroups[item.position] = { total: 0, count: 0 };
      }

      positionGroups[item.position].total += item.daysToHire;
      positionGroups[item.position].count += 1;
    });

    // Calculate average by position
    const positionAverages = Object.entries(positionGroups)
      .map(([position, data]) => ({
        position,
        avgDays: Math.round(data.total / data.count),
        count: data.count,
      }))
      .sort((a, b) => a.avgDays - b.avgDays);

    return {
      avgTimeToHire,
      positionAverages,
      totalHires: candidateData.length,
    };
  } catch (error) {
    console.error('Failed to fetch time to hire report:', error);
    return {
      avgTimeToHire: 0,
      positionAverages: [],
      totalHires: 0,
    };
  }
}

export async function getInterviewOutcomeReport(
  rawFilters: ReportFilters = {}
) {
  await requireManagerOrAdmin();
  const filters = sanitizeFilters(rawFilters);

  try {
    // Build where clause based on filters
    const where: any = {
      status: InterviewStatus.COMPLETED,
    };

    if (filters.startDate) {
      where.startTime = {
        ...where.startTime,
        gte: filters.startDate,
      };
    }

    if (filters.endDate) {
      where.startTime = {
        ...where.startTime,
        lte: filters.endDate,
      };
    }

    if (filters.positionId) {
      where.candidate = {
        positionId: filters.positionId,
      };
    }

    // Get completed interviews with their feedback
    const interviews = await db.interview.findMany({
      where,
      include: {
        feedbacks: {
          select: {
            recommendation: true,
          },
        },
      },
    });

    // Group by recommendation
    const recommendationCounts: Record<Recommendation, number> = {
      [Recommendation.STRONG_HIRE]: 0,
      [Recommendation.HIRE]: 0,
      [Recommendation.NO_DECISION]: 0,
      [Recommendation.NO_HIRE]: 0,
      [Recommendation.STRONG_NO_HIRE]: 0,
    };

    // Count recommendations
    interviews.forEach((interview) => {
      interview.feedbacks.forEach((feedback) => {
        recommendationCounts[feedback.recommendation]++;
      });
    });

    // Transform into a format suitable for charts
    const outcomeData = Object.entries(recommendationCounts).map(
      ([recommendation, count]) => ({
        recommendation,
        count,
      })
    );

    // Calculate totals
    const totalFeedback = outcomeData.reduce(
      (sum, item) => sum + item.count,
      0
    );
    const totalInterviews = interviews.length;
    const interviewsWithFeedback = interviews.filter(
      (i) => i.feedbacks.length > 0
    ).length;

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
  await requireManagerOrAdmin();
  const filters = sanitizeFilters(rawFilters);

  try {
    // Build where clause based on filters
    const where: any = {
      status: CandidateStatus.HIRED,
    };

    // Calculate date range - default to last 12 months if not specified
    const endDate = filters.endDate || new Date();
    const startDate = filters.startDate || subMonths(endDate, 11);

    where.updatedAt = {
      gte: startDate,
      lte: endDate,
    };

    if (filters.positionId) {
      where.positionId = filters.positionId;
    }

    if (filters.source) {
      where.source = filters.source;
    }

    // Get hired candidates
    const hiredCandidates = await db.candidate.findMany({
      where,
      select: {
        id: true,
        updatedAt: true,
      },
    });

    // Prepare month buckets
    const monthlyData: Record<string, number> = {};

    // Initialize all months with 0
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const monthKey = format(currentDate, 'yyyy-MM');
      monthlyData[monthKey] = 0;
      currentDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        1
      );
    }

    // Count hires by month
    hiredCandidates.forEach((candidate) => {
      const monthKey = format(candidate.updatedAt, 'yyyy-MM');
      if (monthlyData[monthKey] !== undefined) {
        monthlyData[monthKey]++;
      }
    });

    // Transform into array for chart
    const monthlyHires = Object.entries(monthlyData).map(
      ([monthKey, count]) => {
        const [year, month] = monthKey.split('-');
        return {
          month: `${format(new Date(parseInt(year), parseInt(month) - 1, 1), 'MMM yyyy')}`,
          count,
        };
      }
    );

    return {
      data: monthlyHires,
      totalHires: hiredCandidates.length,
    };
  } catch (error) {
    console.error('Failed to fetch monthly hires report:', error);
    return {
      data: [],
      totalHires: 0,
    };
  }
}
