import { beforeEach, describe, expect, it, vi } from 'vitest';

// Force the in-memory fallback path. Upstash env vars off → rateLimit
// uses the Map-backed local store.
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;

const { rateLimit } = await import('@/lib/rate-limit');

describe('rateLimit (local fallback)', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('allows the first hit and tracks remaining', async () => {
    const key = `t1:${Math.random()}`;
    const r = await rateLimit(key, { limit: 3, windowMs: 60_000 });
    expect(r.ok).toBe(true);
    expect(r.remaining).toBe(2);
    expect(r.retryAfterMs).toBe(0);
  });

  it('returns ok=false once the bucket is empty', async () => {
    const key = `t2:${Math.random()}`;
    await rateLimit(key, { limit: 2, windowMs: 60_000 });
    await rateLimit(key, { limit: 2, windowMs: 60_000 });
    const third = await rateLimit(key, { limit: 2, windowMs: 60_000 });
    expect(third.ok).toBe(false);
    expect(third.remaining).toBe(0);
    expect(third.retryAfterMs).toBeGreaterThan(0);
  });

  it('resets after the window elapses', async () => {
    const key = `t3:${Math.random()}`;
    vi.useFakeTimers();
    vi.setSystemTime(new Date(0));
    await rateLimit(key, { limit: 1, windowMs: 1000 });
    const denied = await rateLimit(key, { limit: 1, windowMs: 1000 });
    expect(denied.ok).toBe(false);
    vi.setSystemTime(new Date(2000));
    const allowed = await rateLimit(key, { limit: 1, windowMs: 1000 });
    expect(allowed.ok).toBe(true);
  });
});
