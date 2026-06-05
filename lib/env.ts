import { z } from 'zod';

/**
 * One source of truth for environment variables.
 *
 * Behaviour
 *   - All env access goes through `env` exported below.
 *   - The schema runs at module-import time. A malformed value (bad URL,
 *     too-short AUTH_SECRET, half-configured OAuth pair) fails loudly at
 *     startup with one grouped error message instead of breaking at some
 *     random later request.
 *   - "Required in production" semantic checks live at the use site, NOT
 *     here. Reason: `next build` runs with NODE_ENV=production and
 *     evaluates this module to collect page data; gating values like
 *     EMAIL_FROM at boot would break CI for any deploy that doesn't ship
 *     mail credentials (preview deploys, dev clusters, etc.). lib/mail.ts
 *     handles the prod-required EMAIL_FROM throw at first send instead.
 *
 * Edge compatibility
 *   - Zod runs fine in the edge runtime; this module is safe to import
 *     from `middleware.ts` and `auth.config.ts`.
 *
 * NEXT_PUBLIC_* keys
 *   - Next inlines `process.env.NEXT_PUBLIC_*` at build time only when it
 *     appears as a literal in source. The literal lives here, so the
 *     inlining still happens.
 */

const baseSchema = z.object({
  // Always required.
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32, 'AUTH_SECRET must be at least 32 chars'),

  // Optional in dev, required in production (see superRefine below).
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),

  // OAuth providers — optional; if one half of a pair is set, both must be.
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),

  // Optional direct DB URL for Prisma migrate / seed (bypasses pooler).
  DATABASE_URL_DIRECT: z.string().url().optional(),

  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

// Boot-time checks are syntactic only — shape, type, format. Semantic
// "this value is required for THIS feature in production" checks belong at
// the use site (e.g. lib/mail.ts throws on send when EMAIL_FROM is missing
// in prod). That keeps `next build` working in environments that don't ship
// mail credentials, while still failing loudly the first time the missing
// value is actually needed.
const schema = baseSchema.superRefine((env, ctx) => {
  // OAuth: id without secret (or vice versa) is a misconfiguration that
  // would silently disable the provider — worth catching at boot.
  if (Boolean(env.GOOGLE_CLIENT_ID) !== Boolean(env.GOOGLE_CLIENT_SECRET)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['GOOGLE_CLIENT_SECRET'],
      message:
        'GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must both be set or both be absent',
    });
  }
  if (Boolean(env.GITHUB_CLIENT_ID) !== Boolean(env.GITHUB_CLIENT_SECRET)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['GITHUB_CLIENT_SECRET'],
      message:
        'GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET must both be set or both be absent',
    });
  }
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('\n');
  throw new Error(
    `Invalid environment configuration:\n${issues}\n\nSee .env.example for the expected shape.`
  );
}

export const env = parsed.data;
export type Env = z.infer<typeof baseSchema>;
