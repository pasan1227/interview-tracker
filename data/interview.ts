// lib/data/interview.ts

import { db } from '@/lib/db';
import { InterviewStatus, InterviewType, Prisma } from '@/lib/generated/prisma/browser';
import { SAFE_USER_SELECT } from './user';

interface GetInterviewsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  type?: string;
  dateFrom?: Date;
  dateTo?: Date;
  userId?: string;
}

export async function getInterviews({
  page = 1,
  limit = 10,
  search = '',
  status = '',
  type = '',
  dateFrom,
  dateTo,
  userId,
}: GetInterviewsParams) {
  try {
    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: Prisma.InterviewWhereInput = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { candidate: { name: { contains: search, mode: 'insensitive' } } },
        { candidate: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Status / type come from a searchParam — only accept declared enum
    // values, mirroring the candidate-list guard.
    if (status && (Object.values(InterviewStatus) as string[]).includes(status)) {
      where.status = status as InterviewStatus;
    }

    if (type && (Object.values(InterviewType) as string[]).includes(type)) {
      where.type = type as InterviewType;
    }

    if (dateFrom || dateTo) {
      where.startTime = {};

      if (dateFrom) {
        where.startTime.gte = dateFrom;
      }

      if (dateTo) {
        where.startTime.lte = dateTo;
      }
    }

    // If userId is provided, get interviews where the user is an interviewer
    if (userId) {
      where.interviewers = {
        some: {
          id: userId,
        },
      };
    }

    // Get total count for pagination
    const totalInterviews = await db.interview.count({ where });

    // Get interviews with related data
    const interviews = await db.interview.findMany({
      where,
      include: {
        candidate: true,
        position: true,
        interviewers: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        stage: true,
        feedbacks: {
          select: {
            id: true,
            interviewerId: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(totalInterviews / limit);

    return {
      interviews,
      totalInterviews,
      totalPages,
    };
  } catch (error) {
    console.error('Failed to fetch interviews:', error);
    return {
      interviews: [],
      totalInterviews: 0,
      totalPages: 0,
    };
  }
}

export async function getInterviewById(id: string) {
  try {
    const interview = await db.interview.findUnique({
      where: { id },
      include: {
        candidate: true,
        position: true,
        interviewers: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
        stage: true,
        feedbacks: {
          include: {
            interviewer: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            skillAssessments: true,
          },
        },
      },
    });

    return interview;
  } catch (error) {
    console.error('Failed to fetch interview:', error);
    return null;
  }
}

export async function createInterview(
  data: Prisma.InterviewUncheckedCreateInput
) {
  try {
    const interview = await db.interview.create({
      data: {
        ...data,
        notes: data.notes || null,
      },
      include: {
        candidate: true,
        position: true,
        interviewers: { select: SAFE_USER_SELECT },
        stage: true,
      },
    });

    return interview;
  } catch (error) {
    console.error('Failed to create interview:', error);
    throw error;
  }
}

export async function updateInterview(
  id: string,
  data: Prisma.InterviewUncheckedUpdateInput
) {
  try {
    const interview = await db.interview.update({
      where: { id },
      data,
      include: {
        candidate: true,
        position: true,
        interviewers: { select: SAFE_USER_SELECT },
        stage: true,
      },
    });

    return interview;
  } catch (error) {
    console.error('Failed to update interview:', error);
    throw error;
  }
}

export async function deleteInterview(id: string) {
  try {
    await db.interview.delete({
      where: { id },
    });

    return true;
  } catch (error) {
    console.error('Failed to delete interview:', error);
    throw error;
  }
}

export async function getUpcomingInterviewsForUser(userId: string, days = 7) {
  try {
    const now = new Date();
    const endDate = new Date();
    endDate.setDate(now.getDate() + days);

    const interviews = await db.interview.findMany({
      where: {
        interviewers: {
          some: {
            id: userId,
          },
        },
        startTime: {
          gte: now,
          lte: endDate,
        },
        status: InterviewStatus.SCHEDULED,
      },
      include: {
        candidate: true,
        position: true,
        stage: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return interviews;
  } catch (error) {
    console.error('Failed to fetch upcoming interviews:', error);
    return [];
  }
}

export async function getStagesForPosition(positionId: string) {
  try {
    // Get the position with its workflow
    const position = await db.position.findUnique({
      where: { id: positionId },
      include: {
        workflow: {
          include: {
            stages: {
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
      },
    });

    if (!position?.workflow) {
      // If no workflow is associated, try to get the default workflow
      const defaultWorkflow = await db.workflow.findFirst({
        where: { isDefault: true },
        include: {
          stages: {
            orderBy: {
              order: 'asc',
            },
          },
        },
      });

      return defaultWorkflow?.stages || [];
    }

    return position.workflow.stages;
  } catch (error) {
    console.error('Failed to fetch stages for position:', error);
    return [];
  }
}
