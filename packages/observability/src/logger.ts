// packages/observability/src/logger.ts
//
// Pino logger with structured fields. The root logger writes to stdout
// — log aggregation (Sentry / Datadog / CloudWatch) picks it up from
// there. Per-tenant context attaches via child loggers, never via
// globals — that keeps async request flows from cross-contaminating
// each other's logs.
//
// Use:
//   const log = baseLogger.child({ tenant: orgId, requestId });
//   log.info({ candidateId }, 'candidate created');
//
// NEVER log raw passwords, tokens, PII. Pino's redaction is configured
// below for common offenders — extend as new sensitive fields appear.

import pino, { type Logger } from 'pino';

const REDACT_PATHS = [
  'password',
  '*.password',
  'token',
  '*.token',
  'tokenHash',
  '*.tokenHash',
  'authorization',
  '*.authorization',
  'cookie',
  '*.cookie',
  'secret',
  '*.secret',
  'access_token',
  'refresh_token',
  '*.access_token',
  '*.refresh_token',
  // Resumes are not secret per se, but they're PII — never log the
  // body. Logging the storage key is fine.
  '*.parsedResume.rawJson',
];

const isDev =
  process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test';

// JSON output everywhere. We tried `transport: { target: 'pino-pretty' }`
// in dev, but it spawns a worker thread that doesn't survive Next.js
// instrumentation bundling — instrumentation.ts loads logger.ts at boot
// and fails before the app renders.
//
// For pretty dev logs, pipe the process output through pino-pretty:
//   yarn dev:workers | yarn pino-pretty
// Or install globally: `npm i -g pino-pretty` and use `yarn dev:workers | pino-pretty`.
//
// In production, JSON is what log aggregators (Sentry / Datadog /
// CloudWatch / Loki) want anyway.
export const baseLogger: Logger = pino({
  level: process.env.LOG_LEVEL ?? (isDev ? 'debug' : 'info'),
  redact: { paths: REDACT_PATHS, censor: '[REDACTED]' },
  formatters: {
    level: (label) => ({ level: label }),
  },
  base: {
    service: process.env.OTEL_SERVICE_NAME ?? 'hiring-os',
    env: process.env.NODE_ENV ?? 'development',
  },
});

export type TenantLogContext = {
  organizationId?: string | null;
  userId?: string | null;
  requestId?: string;
  // Free-form additional context.
  [k: string]: unknown;
};

export function tenantLogger(ctx: TenantLogContext): Logger {
  return baseLogger.child({
    tenant: ctx.organizationId ?? null,
    actor: ctx.userId ?? null,
    requestId: ctx.requestId,
  });
}

export type { Logger };
