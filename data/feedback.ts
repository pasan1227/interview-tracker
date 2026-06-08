import { db } from '@/lib/db';
import { Prisma } from '@/lib/generated/prisma/browser';

// Skill assessments are stored as a sibling table but the action layer
// passes them as a flat array. We strip them off Prisma's nested-create
// shape and re-insert via the create-many relation below.
type SkillAssessmentInput = {
  skill: string;
  rating: number;
  comment?: string | null;
};

export type CreateFeedbackInput = Omit<
  Prisma.FeedbackUncheckedCreateInput,
  'skillAssessments'
> & {
  skillAssessments?: SkillAssessmentInput[];
};

export type UpdateFeedbackInput = Omit<
  Prisma.FeedbackUncheckedUpdateInput,
  'skillAssessments'
> & {
  skillAssessments?: SkillAssessmentInput[];
};

export async function getFeedbackById(id: string) {
  try {
    const feedback = await db.feedback.findUnique({
      where: { id },
      include: {
        interview: {
          include: {
            candidate: true,
            position: true,
            stage: true,
          },
        },
        candidate: true,
        interviewer: true,
        skillAssessments: true,
      },
    });

    return feedback;
  } catch (error) {
    console.error('Failed to fetch feedback:', error);
    return null;
  }
}

export async function createFeedback(data: CreateFeedbackInput) {
  try {
    // Create the feedback with skill assessments. Skill rows are in
    // the same tenant as their parent feedback — propagate the org id
    // so the nested create satisfies the NOT NULL constraint added in
    // the PR 3 schema migration.
    const { skillAssessments, ...feedbackData } = data;
    const orgId = feedbackData.organizationId;

    const feedback = await db.feedback.create({
      data: {
        ...feedbackData,
        skillAssessments: {
          create: (skillAssessments ?? []).map((s) => ({ ...s, organizationId: orgId })),
        },
      },
      include: {
        interview: true,
        candidate: true,
        interviewer: true,
        skillAssessments: true,
      },
    });

    return feedback;
  } catch (error) {
    console.error('Failed to create feedback:', error);
    throw error;
  }
}

export async function updateFeedback(id: string, data: UpdateFeedbackInput) {
  try {
    // Update the feedback with skill assessments
    const { skillAssessments, ...feedbackData } = data;

    // Delete existing skill assessments
    await db.skillAssessment.deleteMany({
      where: { feedbackId: id },
    });

    // Look up the parent feedback's tenant so the rewritten skill
    // assessments carry the right organizationId. PR 8 will hoist the
    // tenant into the function signature; this is a bridge.
    const parent = await db.feedback.findUniqueOrThrow({
      where: { id },
      select: { organizationId: true },
    });

    // Create new skill assessments
    const feedback = await db.feedback.update({
      where: { id },
      data: {
        ...feedbackData,
        skillAssessments: {
          create: (skillAssessments ?? []).map((s) => ({
            ...s,
            organizationId: parent.organizationId,
          })),
        },
      },
      include: {
        interview: true,
        candidate: true,
        interviewer: true,
        skillAssessments: true,
      },
    });

    return feedback;
  } catch (error) {
    console.error('Failed to update feedback:', error);
    throw error;
  }
}

export async function deleteFeedback(id: string) {
  try {
    // Delete the feedback (skill assessments will be cascade deleted)
    await db.feedback.delete({
      where: { id },
    });

    return true;
  } catch (error) {
    console.error('Failed to delete feedback:', error);
    throw error;
  }
}

export async function getFeedbacksByInterviewer(interviewerId: string) {
  try {
    // Narrow to the fields the my-feedback table renders. Previously
    // included full interview.candidate, interview.position, and a
    // second top-level candidate row — duplicating one another and
    // shipping unrendered scalars (phone, resumeUrl, source, ...).
    const feedbacks = await db.feedback.findMany({
      where: { interviewerId },
      select: {
        id: true,
        rating: true,
        recommendation: true,
        createdAt: true,
        interviewId: true,
        candidate: { select: { id: true, name: true } },
        interview: {
          select: { position: { select: { title: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return feedbacks;
  } catch (error) {
    console.error('Failed to fetch feedbacks by interviewer:', error);
    return [];
  }
}
