import path from 'node:path';
import { defineConfig } from 'prisma/config';

// Walk up to the repo root so the same .env serves every workspace.
for (const candidate of [
  path.resolve('.env'),
  path.resolve('..', '..', '.env'),
]) {
  try {
    process.loadEnvFile(candidate);
    break;
  } catch {
    // try the next candidate
  }
}

const datasourceUrl =
  process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL ?? '';

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  datasource: {
    url: datasourceUrl,
  },
  migrations: {
    path: path.join('prisma', 'migrations'),
    seed: 'tsx prisma/seed.ts',
  },
});
