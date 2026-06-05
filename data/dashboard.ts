// lib/data/dashboard.ts

import { db } from '@/lib/db';
import { CandidateStatus, InterviewStatus } from '@/lib/generated/prisma/browser';
import { addDays, subDays, subMonths } from 'date-fns';

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

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const now = new Date();

    // Total candidates
    const totalCandidates = await db.candidate.count();

    // Total candidates from previous month for comparison
    const lastMonth = subMonths(now, 1);
    const totalCandidatesLastMonth = await db.candidate.count({
      where: {
        createdAt: {
          lt: lastMonth,
        },
      },
    });

    // Calculate percentage change
    const candidateChange =
      totalCandidatesLastMonth === 0
        ? 100
        : Math.round(
            ((totalCandidates - totalCandidatesLastMonth) /
              totalCandidatesLastMonth) *
              100
          );

    // Scheduled interviews
    const nextWeek = addDays(now, 7);
    const scheduledInterviews = await db.interview.count({
      where: {
        startTime: {
          gte: now,
          lte: nextWeek,
        },
        status: InterviewStatus.SCHEDULED,
      },
    });

    // Completed interviews in the last 30 days
    const thirtyDaysAgo = subDays(now, 30);
    const completedInterviews = await db.interview.count({
      where: {
        endTime: {
          gte: thirtyDaysAgo,
          lte: now,
        },
        status: InterviewStatus.COMPLETED,
      },
    });

    // Average time to hire (days from candidate creation to hired status)
    const hiredCandidates = await db.candidate.findMany({
      where: {
        status: CandidateStatus.HIRED,
      },
      select: {
        createdAt: true,
        updatedAt: true,
      },
    });

    let avgTimeToHire = 0;
    if (hiredCandidates.length > 0) {
      const totalDays = hiredCandidates.reduce((total, candidate) => {
        const daysToHire = Math.ceil(
          (candidate.updatedAt.getTime() - candidate.createdAt.getTime()) /
            (1000 * 60 * 60 * 24)
        );
        return total + daysToHire;
      }, 0);

      avgTimeToHire = Math.round(totalDays / hiredCandidates.length);
    }

    // For time to hire change, we'd need historical data
    // This is a placeholder - in a real app you'd compare with previous period
    const timeToHireChange = -5; // 5% improvement (negative is good)

    // Candidates by source
    const sourcesRaw = await db.candidate.groupBy({
      by: ['source'],
      _count: {
        id: true,
      },
      where: {
        source: {
          not: null,
        },
      },
    });

    const candidatesBySource = sourcesRaw
      .map((item) => ({
        source: item.source || 'Unknown',
        count: item._count.id,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Interviews by position
    const positionsRaw = await db.interview.groupBy({
      by: ['positionId'],
      _count: {
        id: true,
      },
    });

    const positionIds = positionsRaw.map((p) => p.positionId);

    const positions = await db.position.findMany({
      where: {
        id: {
          in: positionIds,
        },
      },
      select: {
        id: true,
        title: true,
      },
    });

    const interviewsByPosition = positionsRaw
      .map((item) => {
        const position = positions.find((p) => p.id === item.positionId);
        return {
          position: position?.title || 'Unknown',
          count: item._count.id,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Hiring funnel
    const funnel = await db.candidate.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    const hiringFunnel = {
      new: 0,
      inProcess: 0,
      offered: 0,
      hired: 0,
      rejected: 0,
      withdrawn: 0,
    };

    funnel.forEach((item) => {
      const status = item.status.toLowerCase();
      const count = item._count.id;

      switch (status) {
        case 'new':
          hiringFunnel.new = count;
          break;
        case 'in_process':
          hiringFunnel.inProcess = count;
          break;
        case 'offered':
          hiringFunnel.offered = count;
          break;
        case 'hired':
          hiringFunnel.hired = count;
          break;
        case 'rejected':
          hiringFunnel.rejected = count;
          break;
        case 'withdrawn':
          hiringFunnel.withdrawn = count;
          break;
      }
    });

    // Monthly hires (last 6 months)
    const sixMonthsAgo = subMonths(now, 6);
    const monthlyHiresData = await db.candidate.findMany({
      where: {
        status: CandidateStatus.HIRED,
        updatedAt: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        updatedAt: true,
      },
    });

    const monthlyHiresCounts: Record<string, number> = {};

    // Initialize with the last 6 months
    for (let i = 0; i < 6; i++) {
      const month = subMonths(now, i);
      const monthKey = `${month.getFullYear()}-${month.getMonth() + 1}`;
      monthlyHiresCounts[monthKey] = 0;
    }

    // Count hires by month
    monthlyHiresData.forEach((hire) => {
      const monthKey = `${hire.updatedAt.getFullYear()}-${hire.updatedAt.getMonth() + 1}`;
      if (monthlyHiresCounts[monthKey] !== undefined) {
        monthlyHiresCounts[monthKey]++;
      }
    });

    // Format for chart display
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    const monthlyHires = Object.entries(monthlyHiresCounts)
      .map(([key, count]) => {
        const [year, month] = key.split('-').map(Number);
        return {
          month: `${monthNames[month - 1]} ${year}`,
          count,
        };
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

    // Return default values if there's an error
    return {
      totalCandidates: 0,
      candidateChange: 0,
      scheduledInterviews: 0,
      completedInterviews: 0,
      avgTimeToHire: 0,
      timeToHireChange: 0,
      candidatesBySource: [],
      interviewsByPosition: [],
      hiringFunnel: {
        new: 0,
        inProcess: 0,
        offered: 0,
        hired: 0,
        rejected: 0,
        withdrawn: 0,
      },
      monthlyHires: [],
    };
  }
}

export async function getUpcomingInterviews(limit = 5) {
  try {
    const now = new Date();
    const nextWeek = addDays(now, 7);

    const interviews = await db.interview.findMany({
      where: {
        startTime: {
          gte: now,
          lte: nextWeek,
        },
        status: InterviewStatus.SCHEDULED,
      },
      include: {
        candidate: true,
        position: true,
        interviewers: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
      take: limit,
    });

    return interviews;
  } catch (error) {
    console.error('Failed to fetch upcoming interviews:', error);
    return [];
  }
}

export async function getRecentCandidates(limit = 5) {
  try {
    const candidates = await db.candidate.findMany({
      include: {
        position: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return candidates;
  } catch (error) {
    console.error('Failed to fetch recent candidates:', error);
    return [];
  }
}
