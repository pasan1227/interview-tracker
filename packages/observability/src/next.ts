// packages/observability/src/next.ts
//
// Next.js side of observability. Two entrypoints:
//
//   * initNextInstrumentation()   — call from apps/web/instrumentation.ts
//                                   (Next 13+ auto-imports this file).
//                                   Boots Sentry on the Node runtime.
//
//   * setTenantTags(orgId, ...)   — call from any server handler to
//                                   tag the trace + scope with tenant
//                                   context. Sentry events filtered
//                                   in the UI by `tenant:<orgId>`.
//
// Implementation note (Phase 1.5):
//   @sentry/nextjs does not yet support Next 16 (peer pinned to
//   ^14 || ^15). We use @sentry/node directly here — that's
//   sufficient for server-side error + trace capture. We lose:
//     • client-side browser error capture
//     • the Sentry Webpack plugin (source-map upload)
//     • edge-runtime support
//   All three come back the moment @sentry/nextjs ships a
//   Next 16-compatible release; swap the import below.
//
// The runtime check (`process.env.NEXT_RUNTIME`) keeps the import
// from triggering on the edge runtime where @sentry/node won't load.

let _Sentry: typeof import('@sentry/node') | null = null;

async function loadSentry() {
  if (_Sentry) return _Sentry;
  // Skip Sentry on the edge runtime — @sentry/node would crash.
  if (process.env.NEXT_RUNTIME === 'edge') return null;
  _Sentry = await import('@sentry/node');
  return _Sentry;
}

export async function initNextInstrumentation(): Promise<void> {
  if (!process.env.SENTRY_DSN && !process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  const Sentry = await loadSentry();
  if (!Sentry) return;
  Sentry.init({
    dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    sendDefaultPii: false,
  });
}

export async function setTenantTags(
  organizationId: string | null,
  userId: string | null,
  extra: Record<string, string> = {}
): Promise<void> {
  if (!process.env.SENTRY_DSN && !process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  const Sentry = await loadSentry();
  if (!Sentry) return;
  Sentry.withScope((scope) => {
    if (organizationId) scope.setTag('tenant', organizationId);
    if (userId) scope.setUser({ id: userId });
    for (const [k, v] of Object.entries(extra)) scope.setTag(k, v);
  });
}
