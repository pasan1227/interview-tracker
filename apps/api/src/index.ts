// apps/api/src/index.ts
//
// Hono server entry. Boots observability, mounts the API, listens.
//
// Notable middleware ordering:
//   1. CORS (if external customers hit this directly from a browser
//      it's almost always via PAT in a server-side proxy — but a
//      permissive CORS keeps the OpenAPI Swagger UI / Postman happy).
//   2. requestId — for log correlation. Reflected in X-Request-Id.
//   3. Sentry trace tagging.
//   4. requireToken (per /v1 sub-router).
//   5. rateLimit (also per /v1).

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { randomUUID } from 'node:crypto';
import {
  initNodeObservability,
  shutdownNodeObservability,
  baseLogger,
  setTenantTags,
} from '@hiring-os/observability';
import v1 from './routes/v1/index';
import { rateLimit } from './middleware/rate-limit';
import { openapiSpec } from './openapi';
import type { ApiVariables } from './middleware/auth';

const log = baseLogger.child({ component: 'api' });

async function main() {
  initNodeObservability({
    serviceName: 'hiring-os-api',
    release: process.env.RELEASE,
  });

  const app = new Hono<{ Variables: ApiVariables }>();

  app.use('*', cors());
  app.use('*', async (c, next) => {
    const reqId =
      c.req.header('x-request-id') ?? randomUUID();
    c.header('x-request-id', reqId);
    return next();
  });

  app.use('*', async (c, next) => {
    // Tag traces with tenant once we know it (requireToken sets it).
    await next();
    const token = c.get('apiToken');
    if (token) await setTenantTags(token.organizationId, null);
  });

  app.get('/health', (c) => c.json({ ok: true }));
  app.get('/openapi.json', (c) => c.json(openapiSpec));

  // Apply per-tenant rate limit to every /v1 request.
  const perMinute = Number(process.env.API_RATE_LIMIT_PER_MIN ?? 600);
  app.use('/v1/*', rateLimit(perMinute));
  app.route('/v1', v1);

  app.notFound((c) => c.json({ error: 'Not found' }, 404));
  app.onError((err, c) => {
    log.error({ err }, 'unhandled');
    return c.json({ error: 'Internal server error' }, 500);
  });

  const port = Number(process.env.API_PORT ?? 4001);
  serve({ fetch: app.fetch, port });
  log.info(`api listening on :${port}`);

  const shutdown = async (signal: NodeJS.Signals) => {
    log.info({ signal }, 'shutting down');
    await shutdownNodeObservability();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  baseLogger.fatal({ err }, 'api boot failed');
  process.exit(1);
});
