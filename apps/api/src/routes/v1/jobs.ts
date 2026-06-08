// apps/api/src/routes/v1/jobs.ts
//
// GET /v1/jobs — list active positions. Phase 1 reads `Position`
// directly (the legacy ATS model). When the Job/Pipeline refactor
// ships in Phase 2 this route flips to `Job` without changing the
// external contract.

import { Hono } from 'hono';
import { tenantDb } from '@hiring-os/db';
import { API_SCOPES } from '@hiring-os/api-auth';
import { requireScope } from '../../middleware/scope';
import { requireToken, type ApiVariables } from '../../middleware/auth';
import { encodeCursor, parsePage } from '../../pagination';

const r = new Hono<{ Variables: ApiVariables }>();

r.use('*', requireToken, requireScope(API_SCOPES.JOBS_READ));

r.get('/', async (c) => {
  const ctx = c.get('orgCtx');
  const tdb = tenantDb(ctx);
  const page = parsePage(new URL(c.req.url).searchParams);

  const rows = await tdb.position.findMany({
    where: page.cursor
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
      : undefined,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: page.limit + 1,
    select: {
      id: true,
      title: true,
      department: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const hasMore = rows.length > page.limit;
  const data = hasMore ? rows.slice(0, -1) : rows;
  const nextCursor = hasMore ? encodeCursor(data[data.length - 1]!) : null;

  return c.json({ data, nextCursor });
});

export default r;
