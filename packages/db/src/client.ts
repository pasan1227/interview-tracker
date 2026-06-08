// packages/db/src/client.ts
//
// Base Prisma client singleton. Always import via @hiring-os/db rather
// than this file directly — the public entrypoint also re-exports
// tenantDb(), which is what business logic should usually be calling.
//
// We use the PrismaPg adapter so connections route through the real pg
// driver (rather than Prisma's bundled engine). That gives us
// pgcrypto + RLS-via-SET semantics that Phase 1 depends on, and lets
// workers reuse the same pool config as the web app.

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client';
import { readDbNodeEnv, readDbUrl } from './env';

const prismaClientSingleton = () => {
  const adapter = new PrismaPg({
    connectionString: readDbUrl(),
  });
  return new PrismaClient({
    adapter,
    log:
      readDbNodeEnv() === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
};

type PrismaSingleton = ReturnType<typeof prismaClientSingleton>;

declare global {
  // eslint-disable-next-line no-var
  var __hiringOsPrisma: PrismaSingleton | undefined;
}

export const db: PrismaSingleton =
  globalThis.__hiringOsPrisma ?? prismaClientSingleton();

if (readDbNodeEnv() !== 'production') {
  globalThis.__hiringOsPrisma = db;
}

export type Db = PrismaSingleton;
export default db;
