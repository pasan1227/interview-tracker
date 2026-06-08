// apps/api/src/routes/v1/applications.ts
//
// Phase 1: the Application model doesn't exist yet — Candidate.status
// IS the application status. This route surfaces a "synthetic
// application" shape so customers can start integrating now and
// migrate transparently in Phase 2 when the real Application model
// ships.

import { Hono } from 'hono';
import { tenantDb } from '@hiring-os/db';
import { API_SCOPES } from '@hiring-os/api-auth';
import { requireScope } from '../../middleware/scope';
import { requireToken, type ApiVariables } from '../../middleware/auth';
import { encodeCursor, parsePage } from '../../pagination';

const r = new Hono<{ Variables: ApiVariables }>();

r.use('*', requireToken, requireScope(API_SCOPES.APPLICATIONS_READ));

r.get('/', async (c) => {
  const ctx = c.get('orgCtx');
  const tdb = tenantDb(ctx);
  const page = parsePage(new URL(c.req.url).searchParams);

  const rows = await tdb.candidate.findMany({
    where: {
      ...(page.cursor
        ? {
            OR: [
              { createdAt: { lt: page.cursor.createdAt } },
              {
                AND: [
                  { createdAt: page.cursor.createdAt },
                  { id: { lt: page.cursor.id } },
                ],
              },
            ],
          }
        : {}),
      positionId: { not: null },
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: page.limit + 1,
    select: {
      id: true,
      positionId: true,
      status: true,
      source: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const hasMore = rows.length > page.limit;
  const trimmed = hasMore ? rows.slice(0, -1) : rows;
  const data = trimmed.map((row) => ({
    id: `app_${row.id}`, // namespaced to signal "synthetic" — stable
    candidateId: row.id,
    jobId: row.positionId,
    status: row.status,
    source: row.source,
    appliedAt: row.createdAt,
    movedAt: row.updatedAt,
  }));
  const nextCursor = hasMore ? encodeCursor(trimmed[trimmed.length - 1]!) : null;

  return c.json({ data, nextCursor });
});

export default r;
