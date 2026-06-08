// apps/web/lib/db.ts
//
// Re-export shim — the canonical Prisma client lives in @hiring-os/db
// so apps/web, apps/workers, and apps/api all share one client + the
// tenant extension. Keeping this path alive means the 50+ existing
// `import { db } from '@/lib/db'` callers did not have to change in the
// Phase 1 monorepo migration.

export { db, db as default } from '@hiring-os/db';
