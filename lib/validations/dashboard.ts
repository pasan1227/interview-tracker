import {
  CandidateStatus,
  InterviewStatus,
  InterviewType,
  Recommendation,
} from '@/lib/generated/prisma/client';
import { z } from 'zod';

// Forms send '' or null for unset optional CUIDs — accept those at the input
// boundary, collapse to undefined, then validate format. Input type stays
// `string | null | undefined` so form values type-check against actions.
const cuid = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => (v == null || v === '' ? undefined : v))
  .pipe(z.string().cuid().optional());

// ---------- Candidate ----------
// Privileged fields (createdById, managedById, reviewedById, isActive,
// isArchived) are NOT in these schemas — they're set server-side only.

const candidateBase = {
  name: z.string().trim().min(1, 'Name is required').max(120),
  email: z.string().trim().toLowerCase().email('Valid email is required').max(254),
  phone: z.string().trim().max(40).optional().nullable(),
  resumeUrl: z
    .string()
    .url('Resume URL must be a valid URL')
    .max(2048)
    .optional()
    .nullable()
    .or(z.literal('')),
  status: z.nativeEnum(CandidateStatus).optional(),
  source: z.string().trim().max(80).optional().nullable(),
  positionId: cuid,
};

export const CreateCandidateSchema = z.object({
  ...candidateBase,
  notes: z.string().max(10_000).optional(),
});

export const UpdateCandidateSchema = z.object({
  ...candidateBase,
  notes: z.string().max(10_000).optional(),
}).partial();

export const UpdateCandidateStatusSchema = z.object({
  status: z.nativeEnum(CandidateStatus),
});

// ---------- Interview ----------
// createdById is set server-side. interviewerIds becomes a `connect`.

const interviewBase = {
  title: z.string().trim().min(1, 'Title is required').max(200),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  location: z.string().trim().max(2048).optional().nullable(),
  notes: z.string().max(10_000).optional().nullable(),
  type: z.nativeEnum(InterviewType),
  status: z.nativeEnum(InterviewStatus).optional(),
  candidateId: z.string().cuid(),
  positionId: z.string().cuid(),
  stageId: cuid,
  interviewerIds: z
    .array(z.string().cuid())
    .min(1, 'At least one interviewer is required'),
};

export const CreateInterviewSchema = z
  .object(interviewBase)
  .refine((d) => d.endTime > d.startTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
  });

export const UpdateInterviewSchema = z
  .object({
    ...interviewBase,
    interviewerIds: interviewBase.interviewerIds.optional(),
  })
  .partial()
  .refine(
    (d) => !d.startTime || !d.endTime || d.endTime > d.startTime,
    { message: 'End time must be after start time', path: ['endTime'] }
  );

export const InterviewStatusSchema = z.object({
  status: z.nativeEnum(InterviewStatus),
});

// ---------- Feedback ----------
// interviewerId is set server-side from the session. interviewId and
// candidateId come from the client but the server re-derives candidateId
// from the interview record to prevent mismatched assignments.

export const SkillAssessmentSchema = z.object({
  skill: z.string().trim().min(1).max(80),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional().nullable(),
});

export const CreateFeedbackSchema = z.object({
  interviewId: z.string().cuid(),
  rating: z.number().int().min(1).max(5),
  recommendation: z.nativeEnum(Recommendation),
  comment: z.string().max(10_000).optional().nullable(),
  skillAssessments: z.array(SkillAssessmentSchema).max(50).default([]),
}).passthrough(); // form also sends candidateId; server re-derives it.

export const UpdateFeedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  recommendation: z.nativeEnum(Recommendation),
  comment: z.string().max(10_000).optional().nullable(),
  skillAssessments: z.array(SkillAssessmentSchema).max(50).default([]),
});

// ---------- Workflow / Stage ----------

export const WorkflowInputSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  description: z.string().trim().max(2_000).optional().nullable(),
  isDefault: z.boolean().optional(),
});

export const StageInputSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  description: z.string().trim().max(2_000).optional().nullable(),
});

// ---------- Settings ----------

export const UpdateSettingsSchema = z.object({
  companyName: z.string().trim().min(1).max(120),
  companyLogo: z
    .string()
    .url()
    .max(2_048)
    .optional()
    .nullable()
    .or(z.literal('')),
  emailNotifications: z.boolean(),
  feedbackReminders: z.boolean(),
  defaultInterviewLength: z.coerce.number().int().min(15).max(240),
});

// ---------- Reports ----------
export const ReportFiltersSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  positionId: cuid,
  source: z.string().max(80).optional(),
  minInterviews: z.coerce.number().int().min(0).max(1000).optional(),
});

// `z.input<>` (not z.infer / z.output) so callers can pass the raw shape the
// client form produces — nullable strings, '' for empty CUIDs, etc. The
// schema normalizes to clean output inside the action via .parse().
export type CreateCandidateInput = z.input<typeof CreateCandidateSchema>;
export type UpdateCandidateInput = z.input<typeof UpdateCandidateSchema>;
export type CreateInterviewInput = z.input<typeof CreateInterviewSchema>;
export type UpdateInterviewInput = z.input<typeof UpdateInterviewSchema>;
export type CreateFeedbackInput = z.input<typeof CreateFeedbackSchema>;
export type UpdateFeedbackInput = z.input<typeof UpdateFeedbackSchema>;
export type ReportFiltersInput = z.input<typeof ReportFiltersSchema>;
export type WorkflowInput = z.input<typeof WorkflowInputSchema>;
export type StageInput = z.input<typeof StageInputSchema>;
export type UpdateSettingsInput = z.input<typeof UpdateSettingsSchema>;
