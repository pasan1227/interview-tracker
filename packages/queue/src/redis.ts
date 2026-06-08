// packages/queue/src/redis.ts
//
// Single shared ioredis connection used by every BullMQ queue + worker
// in the process. We accept either a connection string (REDIS_URL,
// works for self-hosted) or an Upstash REST trio (UPSTASH_REDIS_*).
// For Upstash, BullMQ requires the TCP connection variant — the REST
// API doesn't speak the streams protocol BullMQ uses. Phase 1 docs
// will point operators at Upstash's "Connect via redis-cli" details.
//
// Why a singleton: BullMQ's blocking commands hold the connection
// open. Re-creating connections per call exhausts Upstash's
// concurrent-connection limit fast.

import IORedis, { type Redis } from 'ioredis';

let _redis: Redis | null = null;

function readRedisUrl(): string {
  const url = process.env.REDIS_URL ?? process.env.UPSTASH_REDIS_URL;
  if (!url) {
    throw new Error(
      '[hiring-os/queue] REDIS_URL is required. Use Upstash "Connect via redis-cli" string, or any rediss://… for Phase 1.'
    );
  }
  return url;
}

export function getRedis(): Redis {
  if (_redis) return _redis;
  _redis = new IORedis(readRedisUrl(), {
    // BullMQ requirement: blocking commands need this disabled so the
    // client doesn't reject them while waiting for jobs.
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    // TLS auto-on when URL is `rediss://` (Upstash default). No
    // explicit TLS object needed; ioredis parses the protocol.
  });
  _redis.on('error', (err) => {
    // Keep noise low — observability package will pipe this to Sentry.
    console.error('[redis]', err.message);
  });
  return _redis;
}

export async function closeRedis(): Promise<void> {
  if (!_redis) return;
  await _redis.quit();
  _redis = null;
}
