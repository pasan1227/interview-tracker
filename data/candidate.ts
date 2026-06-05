import { db } from '@/lib/db';
import { CandidateStatus, Prisma } from '@/lib/generated/prisma/browser';
import {
  buildPaginatedResult,
  paginate,
  type PaginatedQuery,
  type PaginatedResult,
} from '@/lib/pagination';
import { SAFE_USER_SELECT } from './user';

interface GetCandidatesParams extends PaginatedQuery {
  status?: string;
  position?: string;
}

type CandidateListItem = Prisma.CandidateGetPayload<{
  include: { position: true };
}>;

export async function getCandidates({
  page = 1,
  limit = 10,
  search = '',
  status = '',
  position = '',
}: GetCandidatesParams): Promise<PaginatedResult<CandidateListItem>> {
  try {
    const { skip, take, limit: actualLimit } = paginate({ page, limit });

    const where: Prisma.CandidateWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Status comes from a searchParam; only accept declared enum values
    // so an attacker can't smuggle `?status=DROP TABLE` into Prisma.
    if (status && (Object.values(CandidateStatus) as string[]).includes(status)) {
      where.status = status as CandidateStatus;
    }

    if (position) {
      where.positionId = position;
    }

    const [total, items] = await Promise.all([
      db.candidate.count({ where }),
      db.candidate.findMany({
        where,
        include: { position: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);

    return buildPaginatedResult(items, total, actualLimit);
  } catch (error) {
    console.error('Failed to fetch candidates:', error);
    return { items: [], total: 0, totalPages: 1 };
  }
}

export async function getCandidateById(id: string) {
  try {
    const candidate = await db.candidate.findUnique({
      where: { id },
      include: {
        position: true,
        interviews: {
          include: {
            interviewers: { select: SAFE_USER_SELECT },
            stage: true,
          },
          orderBy: {
            startTime: 'desc',
          },
        },
        feedbacks: {
          include: {
            interviewer: { select: SAFE_USER_SELECT },
            skillAssessments: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        notes: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        tags: true,
      },
    });

    return candidate;
  } catch (error) {
    console.error('Failed to fetch candidate:', error);
    return null;
  }
}

// ---------- Purpose-scoped fetchers ----------
// The detail page used to await getCandidateById up-front, pulling 8
// relations before the header could paint. The fetchers below let each
// page (or each <Suspense> boundary on the detail page) ask for only
// the rows it actually renders.

// Header + tab-count badges. Detail page paints from this synchronously,
// then streams each tab body via getCandidate<Tab> below. Tags ride
// along because the Info tab renders them inline — they're a tiny
// relation and splitting the query for one chip row isn't worth it.
export async function getCandidateHeader(id: string) {
  try {
    return await db.candidate.findUnique({
      where: { id },
      include: {
        position: true,
        tags: true,
        _count: {
          select: { interviews: true, feedbacks: true, notes: true },
        },
      },
    });
  } catch (error) {
    console.error('Failed to fetch candidate header:', error);
    return null;
  }
}

export async function getCandidateInterviewsTab(candidateId: string) {
  try {
    return await db.interview.findMany({
      where: { candidateId },
      include: {
        interviewers: { select: SAFE_USER_SELECT },
        stage: true,
      },
      orderBy: { startTime: 'desc' },
    });
  } catch (error) {
    console.error('Failed to fetch candidate interviews:', error);
    return [];
  }
}

export async function getCandidateFeedbackTab(candidateId: string) {
  try {
    return await db.feedback.findMany({
      where: { candidateId },
      include: {
        interviewer: { select: SAFE_USER_SELECT },
        skillAssessments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('Failed to fetch candidate feedback:', error);
    return [];
  }
}

export async function getCandidateNotesTab(candidateId: string) {
  try {
    return await db.note.findMany({
      where: { candidateId },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('Failed to fetch candidate notes:', error);
    return [];
  }
}

// Edit form only needs scalar fields + position; the include the
// detail page uses is wasted here.
export async function getCandidateForForm(id: string) {
  try {
    return await db.candidate.findUnique({
      where: { id },
      include: { position: true },
    });
  } catch (error) {
    console.error('Failed to fetch candidate for form:', error);
    return null;
  }
}

// Delete page only needs scalars + the impact counts.
export async function getCandidateForDelete(id: string) {
  try {
    return await db.candidate.findUnique({
      where: { id },
      include: {
        position: true,
        _count: {
          select: { interviews: true, feedbacks: true, notes: true },
        },
      },
    });
  } catch (error) {
    console.error('Failed to fetch candidate for delete:', error);
    return null;
  }
}

export async function createCandidate(
  data: Prisma.CandidateUncheckedCreateInput
) {
  try {
    const candidate = await db.candidate.create({
      data,
    });

    return candidate;
  } catch (error) {
    console.error('Failed to create candidate:', error);
    throw error;
  }
}

export async function updateCandidate(
  id: string,
  data: Prisma.CandidateUncheckedUpdateInput
) {
  try {
    const candidate = await db.candidate.update({
      where: { id },
      data,
    });

    return candidate;
  } catch (error) {
    console.error('Failed to update candidate:', error);
    throw error;
  }
}

export async function deleteCandidate(id: string) {
  try {
    await db.candidate.delete({
      where: { id },
    });

    return true;
  } catch (error) {
    console.error('Failed to delete candidate:', error);
    throw error;
  }
}
