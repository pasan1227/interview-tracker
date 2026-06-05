import path from 'node:path';
import { defineConfig } from 'prisma/config';

try {
  process.loadEnvFile(path.resolve('.env'));
} catch {
  // .env is optional
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
