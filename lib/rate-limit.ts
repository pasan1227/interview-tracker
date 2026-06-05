// Sliding-window-ish rate limiter. Uses Upstash Redis when configured
// (UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN) so multi-instance
// serverless deploys see a shared counter; falls back to a process-local
// Map for local dev or unconfigured environments.
//
// Buckets are keyed by a string (typically `${action}:${ip}` or
// `${action}:${email}`).

const REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const USE_UPSTASH = Boolean(REST_URL && REST_TOKEN);

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterMs: number;
};

export async function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): Promise<RateLimitResult> {
  if (USE_UPSTASH) {
    try {
      return await upstashRateLimit(key, limit, windowMs);
    } catch (error) {
      // Fail open with a one-line warning. A redis hiccup shouldn't take
      // login down — log and fall through to the in-memory limiter so the
      // request is still bounded.
      console.error('rate-limit: upstash request failed; using local store', error);
    }
  }
  return localRateLimit(key, limit, windowMs);
}

// ---------- Upstash REST ----------
// Single pipelined call:
//   INCR  key
//   PEXPIRE key windowMs NX   (only sets TTL on first hit)
//   PTTL  key
// PTTL is returned even on existing keys, so we can compute retryAfterMs
// without a second roundtrip.

async function upstashRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const res = await fetch(`${REST_URL}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REST_TOKEN}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
    body: JSON.stringify([
      ['INCR', key],
      ['PEXPIRE', key, String(windowMs), 'NX'],
      ['PTTL', key],
    ]),
  });
  if (!res.ok) {
    throw new Error(`upstash pipeline ${res.status}`);
  }
  const json = (await res.json()) as Array<{ result?: number; error?: string }>;
  const count = Number(json[0]?.result ?? 0);
  const pttl = Number(json[2]?.result ?? windowMs);
  const retryAfterMs = pttl > 0 ? pttl : windowMs;

  if (count > limit) {
    return { ok: false, remaining: 0, retryAfterMs };
  }
  return { ok: true, remaining: Math.max(0, limit - count), retryAfterMs: 0 };
}

// ---------- Local fallback ----------

type Bucket = { count: number; resetAt: number };
const store = new Map<string, Bucket>();
const MAX_KEYS = 5000;

function localRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    pruneIfNeeded(now);
    return { ok: true, remaining: limit - 1, retryAfterMs: 0 };
  }

  if (existing.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterMs: existing.resetAt - now,
    };
  }

  existing.count += 1;
  return {
    ok: true,
    remaining: limit - existing.count,
    retryAfterMs: 0,
  };
}

function pruneIfNeeded(now: number) {
  if (store.size <= MAX_KEYS) return;
  for (const [k, v] of store) {
    if (v.resetAt <= now) store.delete(k);
  }
}
