import { describe, expect, it } from 'vitest';
import {
  CandidatesSearchParamsSchema,
  InterviewsSearchParamsSchema,
} from '@/lib/search-params';
import {
  CreateCandidateSchema,
  UpdateCandidateStatusSchema,
} from '@/lib/validations/dashboard';

describe('CandidatesSearchParamsSchema', () => {
  it('coerces numeric page from string', () => {
    expect(CandidatesSearchParamsSchema.parse({ page: '3' }).page).toBe(3);
  });

  it('defaults to page 1 when missing', () => {
    expect(CandidatesSearchParamsSchema.parse({}).page).toBe(1);
  });

  it('falls back to page 1 for non-numeric input (catch())', () => {
    expect(CandidatesSearchParamsSchema.parse({ page: 'abc' }).page).toBe(1);
  });

  it('clamps page to a minimum of 1', () => {
    expect(CandidatesSearchParamsSchema.parse({ page: '0' }).page).toBe(1);
  });

  it('caps search string length', () => {
    const long = 'x'.repeat(500);
    // Should not throw; catch() falls back to default ''.
    const parsed = CandidatesSearchParamsSchema.parse({ search: long });
    expect(parsed.search).toBe('');
  });
});

describe('InterviewsSearchParamsSchema', () => {
  it('accepts the canonical filter set', () => {
    const parsed = InterviewsSearchParamsSchema.parse({
      page: '2',
      search: 'sarah',
      status: 'SCHEDULED',
      type: 'TECHNICAL',
      date: 'this-week',
    });
    expect(parsed.page).toBe(2);
    expect(parsed.status).toBe('SCHEDULED');
  });
});

describe('CreateCandidateSchema', () => {
  it('requires a name', () => {
    const result = CreateCandidateSchema.safeParse({
      email: 'a@b.com',
      name: '',
    });
    expect(result.success).toBe(false);
  });

  it('lowercases and trims the email', () => {
    const parsed = CreateCandidateSchema.parse({
      name: 'Sarah',
      email: '  Sarah@Example.COM  ',
    });
    expect(parsed.email).toBe('sarah@example.com');
  });

  it('collapses empty resumeUrl through the cuid/empty-string transform', () => {
    // resumeUrl accepts '' through the schema's nullable + literal('') branch.
    const parsed = CreateCandidateSchema.parse({
      name: 'X',
      email: 'x@y.com',
      resumeUrl: '',
    });
    expect(parsed.resumeUrl).toBe('');
  });
});

describe('UpdateCandidateStatusSchema', () => {
  it('rejects unknown enum values', () => {
    const r = UpdateCandidateStatusSchema.safeParse({ status: 'BOGUS' });
    expect(r.success).toBe(false);
  });

  it('accepts a real enum value', () => {
    const r = UpdateCandidateStatusSchema.safeParse({ status: 'HIRED' });
    expect(r.success).toBe(true);
  });
});
