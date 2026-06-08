// scripts/check-env.mjs
//
// Probe every Phase 1 env var — presence, format, and live
// connectivity where possible. Run via:
//
//   yarn check:env
//
// Exit code 0 if everything required is healthy, 1 otherwise.
// Warnings (RLS bypass, missing optional integrations) don't fail.

import { PrismaPg } from '@prisma/adapter-pg';
import IORedis from 'ioredis';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import Stripe from 'stripe';
import { Resend } from 'resend';

const reset = '\x1b[0m';
const bold = '\x1b[1m';
const dim = '\x1b[2m';
const red = '\x1b[31m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const blue = '\x1b[34m';
const gray = '\x1b[90m';

const symbols = {
  ok: `${green}[OK]  ${reset}`,
  fail: `${red}[FAIL]${reset}`,
  warn: `${yellow}[WARN]${reset}`,
  skip: `${gray}[SKIP]${reset}`,
};

const results = { ok: 0, warn: 0, fail: 0, skip: 0 };

function log(status, key, msg, extra) {
  results[status] += 1;
  const main = `  ${symbols[status]}  ${bold}${key.padEnd(28)}${reset}${msg ?? ''}`;
  console.log(main);
  if (extra) console.log(`        ${dim}${extra}${reset}`);
}

function section(name) {
  console.log(`\n${blue}${bold}${name}${reset}`);
}

// ── Helpers ─────────────────────────────────────────────────────────

function parsePostgresUrl(url) {
  try {
    const u = new URL(url);
    return {
      user: u.username,
      host: u.hostname,
      db: u.pathname.slice(1).split('?')[0],
      isPooler: u.hostname.includes('-pooler.'),
    };
  } catch {
    return null;
  }
}

async function testPostgres(url, label) {
  const parsed = parsePostgresUrl(url);
  if (!parsed) return log('fail', label, ' — unparseable URL');

  try {
    const adapter = new PrismaPg({ connectionString: url });
    const conn = await adapter.connect();
    const result = await conn.executeScript('SELECT 1');
    void result;
    await conn.dispose();
    return parsed;
  } catch (err) {
    log('fail', label, ` — connection failed`, err.message);
    return null;
  }
}

// ── 1. Core (DB + auth + base URL) ──────────────────────────────────

async function checkCore() {
  section('Core');

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    log('fail', 'DATABASE_URL', ' — missing');
  } else {
    const parsed = parsePostgresUrl(dbUrl);
    if (!parsed) {
      log('fail', 'DATABASE_URL', ' — unparseable');
    } else {
      // Try to connect via Prisma adapter (validates real connectivity)
      try {
        const adapter = new PrismaPg({ connectionString: dbUrl });
        const conn = await adapter.connect();
        await conn.executeScript('SELECT 1');
        await conn.dispose();
        log(
          'ok',
          'DATABASE_URL',
          ` ${dim}${parsed.user}@${parsed.host}/${parsed.db}${reset}`
        );
      } catch (err) {
        log('fail', 'DATABASE_URL', ' — could not connect', err.message);
      }
      // Owner-role warning
      if (
        parsed.user.endsWith('_owner') ||
        parsed.user === 'postgres' ||
        parsed.user === 'neondb_owner'
      ) {
        log(
          'warn',
          'DATABASE_URL',
          ` — using role '${parsed.user}'`,
          `Owner roles BYPASS RLS. Create app_role and switch DATABASE_URL to use it. See Tier 2 in the env guide.`
        );
      }
    }
  }

  const directUrl = process.env.DATABASE_URL_DIRECT;
  if (!directUrl) {
    log(
      'warn',
      'DATABASE_URL_DIRECT',
      ' — missing (falls back to DATABASE_URL for migrations)'
    );
  } else {
    const parsed = parsePostgresUrl(directUrl);
    if (!parsed) {
      log('fail', 'DATABASE_URL_DIRECT', ' — unparseable');
    } else if (parsed.isPooler) {
      log(
        'warn',
        'DATABASE_URL_DIRECT',
        ` — points at the POOLER (${parsed.host})`,
        `Prisma migrate needs a direct connection. Remove "-pooler" from the hostname.`
      );
    } else {
      log('ok', 'DATABASE_URL_DIRECT', ` ${dim}${parsed.host} (non-pooler ✓)${reset}`);
    }
  }

  const authSecret = process.env.AUTH_SECRET;
  if (!authSecret) {
    log('fail', 'AUTH_SECRET', ' — missing');
  } else if (authSecret.length < 32) {
    log(
      'fail',
      'AUTH_SECRET',
      ` — only ${authSecret.length} chars (need ≥ 32)`,
      `Regenerate with: openssl rand -base64 32`
    );
  } else {
    log('ok', 'AUTH_SECRET', ` ${dim}${authSecret.length} chars${reset}`);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    log('warn', 'NEXT_PUBLIC_APP_URL', ' — missing (emails will have broken links)');
  } else if (appUrl.endsWith('/')) {
    log(
      'warn',
      'NEXT_PUBLIC_APP_URL',
      ' — has trailing slash (will produce double-slashes in links)'
    );
  } else {
    log('ok', 'NEXT_PUBLIC_APP_URL', ` ${dim}${appUrl}${reset}`);
  }
}

// ── 2. Redis ─────────────────────────────────────────────────────────

async function checkRedis() {
  section('Redis (BullMQ + API rate limit)');

  const url = process.env.REDIS_URL;
  if (!url) {
    log(
      'fail',
      'REDIS_URL',
      ' — missing',
      `Workers + API rate limit won't run. Get one from upstash.com (free).`
    );
    return;
  }

  let host = '?';
  try {
    host = new URL(url).hostname;
  } catch {
    log('fail', 'REDIS_URL', ' — unparseable URL');
    return;
  }

  const redis = new IORedis(url, {
    maxRetriesPerRequest: 1,
    connectTimeout: 5000,
    lazyConnect: true,
  });
  const start = Date.now();
  try {
    await redis.connect();
    const pong = await redis.ping();
    const ms = Date.now() - start;
    if (pong === 'PONG') {
      log('ok', 'REDIS_URL', ` ${dim}${host} (${ms}ms)${reset}`);
    } else {
      log('fail', 'REDIS_URL', ` — unexpected PING response: ${pong}`);
    }
  } catch (err) {
    log('fail', 'REDIS_URL', ` — connection failed`, err.message);
  } finally {
    redis.disconnect();
  }
}

// ── 3. Object storage ────────────────────────────────────────────────

async function checkStorage() {
  section('Object storage (resume uploads)');

  const endpoint = process.env.STORAGE_ENDPOINT;
  const accessKeyId = process.env.STORAGE_ACCESS_KEY_ID;
  const secretAccessKey = process.env.STORAGE_SECRET_ACCESS_KEY;
  const bucket = process.env.STORAGE_BUCKET;
  const region = process.env.STORAGE_REGION ?? 'auto';

  const missing = [];
  if (!accessKeyId) missing.push('STORAGE_ACCESS_KEY_ID');
  if (!secretAccessKey) missing.push('STORAGE_SECRET_ACCESS_KEY');
  if (!bucket) missing.push('STORAGE_BUCKET');

  if (missing.length === 4 - (endpoint ? 1 : 0)) {
    log('skip', 'STORAGE_*', ' — not configured (upload routes will throw on use)');
    return;
  }

  if (missing.length > 0) {
    for (const k of missing) log('fail', k, ' — missing');
    return;
  }

  const client = new S3Client({
    region,
    endpoint: endpoint || undefined,
    forcePathStyle: Boolean(endpoint),
    credentials: { accessKeyId, secretAccessKey },
  });

  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    log(
      'ok',
      'STORAGE_*',
      ` ${dim}bucket '${bucket}' reachable (${endpoint ? 'R2' : 'AWS'} / ${region})${reset}`
    );
  } catch (err) {
    const code = err.$metadata?.httpStatusCode;
    if (code === 404) {
      log(
        'fail',
        'STORAGE_BUCKET',
        ` — bucket '${bucket}' not found`,
        `Create it in the R2/S3 console, or change STORAGE_BUCKET.`
      );
    } else if (code === 403 || code === 401) {
      log(
        'fail',
        'STORAGE_ACCESS_KEY_ID',
        ` — credentials rejected (${code})`,
        `Verify the API token has read+write permission on '${bucket}'.`
      );
    } else {
      log('fail', 'STORAGE_*', ` — ${err.name ?? 'error'}`, err.message);
    }
  }
}

// ── 4. Stripe ────────────────────────────────────────────────────────

async function checkStripe() {
  section('Stripe (billing)');

  const secret = process.env.STRIPE_SECRET_KEY;
  const publishable = process.env.STRIPE_PUBLISHABLE_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    log(
      'skip',
      'STRIPE_SECRET_KEY',
      ' — not configured (ensureCustomer + webhook route will throw)'
    );
    return;
  }

  if (!secret.startsWith('sk_test_') && !secret.startsWith('sk_live_')) {
    log(
      'fail',
      'STRIPE_SECRET_KEY',
      ` — invalid format (must start with sk_test_ or sk_live_)`
    );
    return;
  }

  const mode = secret.startsWith('sk_live_') ? 'LIVE' : 'TEST';
  if (mode === 'LIVE') {
    log(
      'warn',
      'STRIPE_SECRET_KEY',
      ` — using LIVE keys`,
      `Real cards will be charged. Are you sure?`
    );
  }

  try {
    // No explicit apiVersion — the SDK uses the account's pinned version.
    const stripe = new Stripe(secret);
    const acct = await stripe.accounts.retrieve();
    log(
      'ok',
      'STRIPE_SECRET_KEY',
      ` ${dim}${mode} mode, account ${acct.id} (${acct.email ?? 'no email'})${reset}`
    );
  } catch (err) {
    log('fail', 'STRIPE_SECRET_KEY', ` — API call failed`, err.message);
  }

  if (!publishable) {
    log('warn', 'STRIPE_PUBLISHABLE_KEY', ' — missing (client checkout won\'t render)');
  } else if (
    !publishable.startsWith('pk_test_') &&
    !publishable.startsWith('pk_live_')
  ) {
    log('fail', 'STRIPE_PUBLISHABLE_KEY', ` — invalid format`);
  } else {
    const pubMode = publishable.startsWith('pk_live_') ? 'LIVE' : 'TEST';
    if (pubMode !== mode) {
      log(
        'fail',
        'STRIPE_PUBLISHABLE_KEY',
        ` — ${pubMode} key mixed with ${mode} secret key`,
        `Both must be from the same mode toggle in the Stripe dashboard.`
      );
    } else {
      log('ok', 'STRIPE_PUBLISHABLE_KEY', ` ${dim}${pubMode} mode${reset}`);
    }
  }

  if (!webhookSecret) {
    log(
      'warn',
      'STRIPE_WEBHOOK_SECRET',
      ' — missing',
      `Run: stripe listen --forward-to localhost:3000/api/billing/webhook`
    );
  } else if (!webhookSecret.startsWith('whsec_')) {
    log('fail', 'STRIPE_WEBHOOK_SECRET', ` — invalid format (must start with whsec_)`);
  } else {
    log('ok', 'STRIPE_WEBHOOK_SECRET', ` ${dim}whsec_… (${webhookSecret.length} chars)${reset}`);
  }
}

// ── 5. Email (Resend) ────────────────────────────────────────────────

async function checkEmail() {
  section('Email (Resend)');

  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!key) {
    log(
      'warn',
      'RESEND_API_KEY',
      ' — missing (all transactional email will fail)'
    );
  } else if (!key.startsWith('re_')) {
    log('fail', 'RESEND_API_KEY', ` — invalid format (must start with re_)`);
  } else {
    try {
      const resend = new Resend(key);
      const { error, data } = await resend.domains.list();
      if (error) {
        log('fail', 'RESEND_API_KEY', ` — API rejected`, error.message);
      } else {
        const verified = (data?.data ?? []).filter((d) => d.status === 'verified');
        log(
          'ok',
          'RESEND_API_KEY',
          ` ${dim}${(data?.data ?? []).length} domain(s), ${verified.length} verified${reset}`
        );
      }
    } catch (err) {
      log('fail', 'RESEND_API_KEY', ` — API call failed`, err.message);
    }
  }

  if (!from) {
    log(
      'warn',
      'EMAIL_FROM',
      ' — missing',
      `For dev, use: EMAIL_FROM="Hiring OS <onboarding@resend.dev>"`
    );
  } else if (!/<.+@.+>/.test(from) && !from.includes('@')) {
    log('fail', 'EMAIL_FROM', ` — invalid format (need an email address)`);
  } else {
    log('ok', 'EMAIL_FROM', ` ${dim}${from}${reset}`);
  }
}

// ── 6. OAuth (presence only) ─────────────────────────────────────────

function checkOAuth() {
  section('OAuth (optional)');

  for (const provider of ['GOOGLE', 'GITHUB']) {
    const id = process.env[`${provider}_CLIENT_ID`];
    const secret = process.env[`${provider}_CLIENT_SECRET`];
    if (!id && !secret) {
      log('skip', `${provider}_*`, ' — not configured (provider disabled)');
    } else if (!id || !secret) {
      log(
        'fail',
        `${provider}_*`,
        ' — only one half set; lib/env.ts will refuse to boot',
        `Set BOTH ${provider}_CLIENT_ID and ${provider}_CLIENT_SECRET, or leave BOTH blank.`
      );
    } else {
      log('ok', `${provider}_*`, ` ${dim}both halves set${reset}`);
    }
  }
}

// ── 7. Observability (presence only — DSNs are write-only) ───────────

function checkObservability() {
  section('Observability (optional)');

  const sentry = process.env.SENTRY_DSN;
  if (!sentry) {
    log('skip', 'SENTRY_DSN', ' — not configured (no error reporting)');
  } else if (!/^https:\/\/[^@]+@/.test(sentry)) {
    log('fail', 'SENTRY_DSN', ` — invalid format (expected https://<key>@<host>/<id>)`);
  } else {
    log('ok', 'SENTRY_DSN', ` ${dim}${new URL(sentry).host}${reset}`);
  }

  const otel = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!otel) {
    log('skip', 'OTEL_EXPORTER_OTLP_ENDPOINT', ' — not configured (no traces)');
  } else {
    log('ok', 'OTEL_EXPORTER_OTLP_ENDPOINT', ` ${dim}${otel}${reset}`);
    if (!process.env.OTEL_EXPORTER_OTLP_HEADERS) {
      log(
        'warn',
        'OTEL_EXPORTER_OTLP_HEADERS',
        ' — missing (most OTLP backends require an auth header)'
      );
    }
  }
}

// ── Run all ─────────────────────────────────────────────────────────

async function main() {
  console.log(`${bold}Hiring OS — environment check${reset}`);
  console.log(`${dim}=============================${reset}`);

  await checkCore();
  await checkRedis();
  await checkStorage();
  await checkStripe();
  await checkEmail();
  checkOAuth();
  checkObservability();

  console.log(`\n${bold}Summary${reset}`);
  console.log(`  ${green}${results.ok} ok${reset}`);
  console.log(`  ${yellow}${results.warn} warning${results.warn === 1 ? '' : 's'}${reset}`);
  console.log(`  ${red}${results.fail} failure${results.fail === 1 ? '' : 's'}${reset}`);
  console.log(`  ${gray}${results.skip} skipped${reset}\n`);

  if (results.fail > 0) {
    console.log(`${red}One or more required checks failed.${reset}\n`);
    process.exit(1);
  }
  if (results.warn > 0) {
    console.log(
      `${yellow}Everything required works. Address warnings before deploying.${reset}\n`
    );
  } else {
    console.log(`${green}All systems green.${reset}\n`);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(`\n${red}check-env crashed:${reset}`, err);
  process.exit(2);
});
