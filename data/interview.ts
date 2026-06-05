import { db } from '@/lib/db';
import {
  InterviewStatus,
  InterviewType,
  Prisma,
  UserRole,
} from '@/lib/generated/prisma/browser';
import {
  buildPaginatedResult,
  paginate,
  type PaginatedQuery,
  type PaginatedResult,
} from '@/lib/pagination';
import { SAFE_USER_SELECT } from './user';

interface GetInterviewsParams extends PaginatedQuery {
  status?: string;
  type?: string;
  dateFrom?: Date;
  dateTo?: Date;
  userId?: string;
}

type InterviewListItem = Prisma.InterviewGetPayload<{
  include: {
    candidate: true;
    position: true;
    interviewers: { select: { id: true; name: true; email: true; image: true } };
    stage: true;
    feedbacks: { select: { id: true; interviewerId: true } };
  };
}>;

export async function getInterviews({
  page = 1,
  limit = 10,
  search = '',
  status = '',
  type = '',
  dateFrom,
  dateTo,
  userId,
}: GetInterviewsParams): Promise<PaginatedResult<InterviewListItem>> {
  try {
    const { skip, take, limit: actualLimit } = paginate({ page, limit });

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
      if (dateFrom) where.startTime.gte = dateFrom;
      if (dateTo) where.startTime.lte = dateTo;
    }

    if (userId) {
      where.interviewers = { some: { id: userId } };
    }

    const [total, items] = await Promise.all([
      db.interview.count({ where }),
      db.interview.findMany({
        where,
        include: {
          candidate: true,
          position: true,
          interviewers: {
            select: { id: true, name: true, email: true, image: true },
          },
          stage: true,
          feedbacks: { select: { id: true, interviewerId: true } },
        },
        orderBy: { startTime: 'asc' },
        skip,
        take,
      }),
    ]);

    return buildPaginatedResult(items, total, actualLimit);
  } catch (error) {
    console.error('Failed to fetch interviews:', error);
    return {
      items: [],
      total: 0,
      totalPages: 1,
    };
  }
}

// View-scoped fetch: same shape as getInterviewById, but strips co-
// interviewers' email addresses unless the viewer is a manager/admin.
// The unsanitized variant stays available for server-internal callers
// (createInterview's email fan-out, handleStatusChangeEmails) that
// legitimately need every recipient.
export async function getInterviewByIdForViewer(
  id: string,
  viewer: { id: string; role: UserRole }
) {
  const interview = await getInterviewById(id);
  if (!interview) return null;
  if (viewer.role === UserRole.ADMIN || viewer.role === UserRole.MANAGER) {
    return interview;
  }
  // Non-privileged viewer: keep their own email, blank everyone else's.
  return {
    ...interview,
    interviewers: interview.interviewers.map((i) =>
      i.id === viewer.id ? i : { ...i, email: null }
    ),
    feedbacks: interview.feedbacks.map((f) =>
      f.interviewer.id === viewer.id
        ? f
        : { ...f, interviewer: { ...f.interviewer, email: null } }
    ),
  };
}

// Edit form's needs: scalar fields + candidate/position labels +
// current interviewer roster. Skips feedbacks + skill assessments
// which the form doesn't render.
export async function getInterviewForForm(id: string) {
  try {
    return await db.interview.findUnique({
      where: { id },
      include: {
        candidate: { select: { id: true, name: true, email: true } },
        position: { select: { id: true, title: true } },
        interviewers: { select: SAFE_USER_SELECT },
        stage: { select: { id: true, name: true, order: true } },
      },
    });
  } catch (error) {
    console.error('Failed to fetch interview for form:', error);
    return null;
  }
}

// Email side-effects only need recipients + subject-line fields, not
// the full feedback tree.
export async function getInterviewForEmails(id: string) {
  try {
    return await db.interview.findUnique({
      where: { id },
      include: {
        candidate: { select: { id: true, name: true, email: true } },
        interviewers: { select: SAFE_USER_SELECT },
      },
    });
  } catch (error) {
    console.error('Failed to fetch interview for emails:', error);
    return null;
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

// getStagesForPosition removed — interview form now reads stages from
// the pre-computed `stagesByPosition` map returned by
// getInterviewFormOptions instead of round-tripping per position pick.
