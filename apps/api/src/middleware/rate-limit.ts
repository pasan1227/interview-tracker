// apps/api/src/middleware/rate-limit.ts
//
// Per-tenant rate limiter using Redis INCR + EXPIRE. Phase 1 ships a
// flat per-minute limit; per-endpoint and per-token granularity come
// when we feel pain (e.g. one tenant scraping /v1/candidates 100 rps).
//
// The key shape — rl:<orgId>:<minute-bucket> — supports horizontal
// shards trivially: every API instance writes to the same Redis, the
// limit is global.

import type { MiddlewareHandler } from 'hono';
import { getRedis } from '@hiring-os/queue';
import type { ApiVariables } from './auth';

const WINDOW_SEC = 60;

export function rateLimit(perMinute: number): MiddlewareHandler<{
  Variables: ApiVariables;
}> {
  return async (c, next) => {
    const token = c.get('apiToken');
    if (!token) return next();
    const bucket = Math.floor(Date.now() / 1000 / WINDOW_SEC);
    const key = `rl:${token.organizationId}:${bucket}`;
    const redis = getRedis();
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, WINDOW_SEC);

    c.header('X-RateLimit-Limit', String(perMinute));
    c.header('X-RateLimit-Remaining', String(Math.max(0, perMinute - count)));

    if (count > perMinute) {
      c.header('Retry-After', String(WINDOW_SEC));
      return c.json(
        { error: 'Rate limit exceeded', limit: perMinute, window: 'minute' },
        429
      );
    }
    return next();
  };
}
