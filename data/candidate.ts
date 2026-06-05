// lib/data/candidate.ts

import { db } from '@/lib/db';
import { CandidateStatus, Prisma } from '@/lib/generated/prisma/browser';

interface GetCandidatesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  position?: string;
}

export async function getCandidates({
  page = 1,
  limit = 10,
  search = '',
  status = '',
  position = '',
}: GetCandidatesParams) {
  try {
    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: Prisma.CandidateWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status as CandidateStatus;
    }

    if (position) {
      where.positionId = position;
    }

    // Get total count for pagination
    const totalCandidates = await db.candidate.count({ where });

    // Get candidates with related data
    const candidates = await db.candidate.findMany({
      where,
      include: {
        position: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(totalCandidates / limit);

    return {
      candidates,
      totalCandidates,
      totalPages,
    };
  } catch (error) {
    console.error('Failed to fetch candidates:', error);
    return {
      candidates: [],
      totalCandidates: 0,
      totalPages: 0,
    };
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
            interviewers: true,
            stage: true,
          },
          orderBy: {
            startTime: 'desc',
          },
        },
        feedbacks: {
          include: {
            interviewer: true,
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

export async function createCandidate(data: any) {
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

export async function updateCandidate(id: string, data: any) {
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
