// packages/db/src/env.ts
//
// The db package is consumed by apps/web (Next.js), apps/workers (Node
// process), and apps/api (Hono). All three need DATABASE_URL but they
// load env differently — Next via next.config.ts + process.env, workers
// via dotenv-flow at boot, the API likewise. We resolve from
// process.env here and validate softly: throw only at first use, not at
// module load, so seed scripts and `prisma migrate` can boot without a
// full env.

export function readDbUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      '[hiring-os/db] DATABASE_URL is not set. Configure it in the root .env or your process env.'
    );
  }
  return url;
}

export function readDbNodeEnv(): 'development' | 'production' | 'test' {
  const v = process.env.NODE_ENV;
  if (v === 'production' || v === 'test') return v;
  return 'development';
}
