import * as z from 'zod';

// Common pieces every list page accepts. Spread these into per-page
// schemas so a typo (?paeg=2) gets normalized to defaults instead of
// reaching Prisma as NaN. coerce.number() handles the URL-string-to-int
// conversion; catch() swallows invalid input rather than throwing —
// pages should still render with default filters on bad URLs.
export const PageNumberSchema = z.coerce.number().int().min(1).catch(1);
export const SearchStringSchema = z.string().max(200).catch('');

export const CandidatesSearchParamsSchema = z.object({
  page: PageNumberSchema.default(1),
  search: SearchStringSchema.default(''),
  status: z.string().max(40).default(''),
  position: z.string().max(40).default(''),
});

export const InterviewsSearchParamsSchema = z.object({
  page: PageNumberSchema.default(1),
  search: SearchStringSchema.default(''),
  status: z.string().max(40).default(''),
  type: z.string().max(40).default(''),
  date: z.string().max(40).default(''),
});

export type CandidatesSearchParams = z.infer<
  typeof CandidatesSearchParamsSchema
>;
export type InterviewsSearchParams = z.infer<
  typeof InterviewsSearchParamsSchema
>;
