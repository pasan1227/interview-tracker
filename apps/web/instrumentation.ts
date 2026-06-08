// apps/web/instrumentation.ts
//
// Next.js automatically imports this file at boot for BOTH the Node
// and Edge runtimes. We use it to wire Sentry across the web app via
// the shared observability package.
//
// CRITICAL — import from the '/next' subpath, NOT the package's main
// entry. The main entry transitively re-exports node.ts which
// imports @sentry/node + @opentelemetry/sdk-node — neither loads on
// the Edge runtime. The '/next' subpath only contains code that's
// safe for both runtimes (it does its own NEXT_RUNTIME === 'edge'
// guard before touching @sentry/node).

import { initNextInstrumentation } from '@hiring-os/observability/next';

export async function register() {
  await initNextInstrumentation();
}
